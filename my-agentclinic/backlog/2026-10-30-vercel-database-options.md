# Database options for deploying to Vercel

**Status:** Backlog. Research is done, no decision yet.
**Date:** 2026-10-30

## Question

What database should AgentClinic use if we deploy to Vercel, while keeping local development easy?

## Why the current setup can't be deployed as is

AgentClinic stores its data in a SQLite file (`data/agentclinic.db`) through Node's built-in `node:sqlite` (see [specs/tech-stack.md](../specs/tech-stack.md)).

Vercel functions have a **read-only filesystem**. The only writable place is a `/tmp` scratch space (up to 500 MB) that doesn't persist. Every deploy, scale-out, or archived function would start with a fresh, empty database. Production needs a database hosted over the network.

Vercel's storage docs also say:

- **Vercel Postgres no longer exists.** Existing databases were moved to Neon in December 2024.
- New projects install a database from the **Vercel Marketplace**. `vercel install <provider>` (for example `neon`, `supabase`, `upstash`) links it to the project and puts its credentials in `.env.local`.
- Marketplace storage providers include Neon, Supabase, Prisma Postgres, AWS Aurora Postgres, Redis and Upstash for Redis.

## Options

| Option | Production | Local development | Fit for AgentClinic |
| --- | --- | --- | --- |
| **Turso (libSQL)** | A hosted fork of SQLite | A plain local file or `:memory:`, the same as today | Closest to what we have. `schema.sql`, the `CHECK` constraints, the partial unique index and `datetime('now')` should mostly carry over unchanged. |
| **Neon Postgres** (Marketplace) | Serverless Postgres, set up natively through the Marketplace | A local Postgres in Docker, a Neon branch per developer, or PGlite (Postgres running in-process, so tests stay in memory) | Best integrated with Vercel and the most popular stack, which suits Mary's ask for a popular stack. The SQL needs porting (see below). |
| **Supabase** (Marketplace) | Postgres plus auth and storage | The Supabase CLI runs a local stack in Docker | Its built-in auth could close the "`/staff` has no login" gap, but otherwise it's more than we need. |
| **Prisma Postgres** (Marketplace) | Managed Postgres | Good with Prisma | Brings in an ORM, which goes against the tech stack's "No ORM" rule. |

### Porting the schema to Postgres (Neon, Supabase or Prisma Postgres)

- `INTEGER PRIMARY KEY` becomes `INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY` (or `SERIAL`).
- `datetime('now')` becomes `now()`, and the `TEXT` timestamp columns should become `timestamptz`.
- Check that `length(trim(...))` checks and partial unique indexes behave the same way.
- `lastInsertRowid` becomes `INSERT ... RETURNING id`.
- `?` placeholders become `$1`, `$2`, ... (depending on the client).

## The cost common to every option

`node:sqlite`'s `DatabaseSync` is **synchronous**, and every remote client is **asynchronous**. Moving to any hosted database means:

- every function in `src/db/*.ts` becomes `async`
- every route in `src/app.tsx` and `src/staff.tsx` needs `await`
- the `transaction()` helper, the seed and the startup migration all need rewriting
- the tests that use `openDb(':memory:')` need an async in-memory equivalent: libSQL `:memory:` for Turso, or PGlite for Postgres

That rework is bigger than the choice of database. It should be a roadmap phase of its own, done **before** the deploy phase.

## Recommendation

- **Keep it SQLite-shaped: Turso.** Local work stays a single file, and in-memory tests keep working. Only the client library and async calls change. It's the smallest step from where we are, which fits the mission's "small phases" rule.
- **Go with Vercel's main path: Neon via the Marketplace,** with PGlite for local work and tests so nobody needs Docker. We pay once to port the SQL and end up on the most mainstream setup.

For a course project, prefer **Turso**. If AgentClinic is expected to become a real deployed product, prefer **Neon**.

## Before deciding

- [ ] Check Turso's current docs: libSQL local-file and `:memory:` modes, its Node client, how closely it matches SQLite, and whether it is offered on the Vercel Marketplace.
- [ ] Check PGlite's current docs: Node support, and whether it runs under Vitest.
- [ ] Check how Hono deploys to Vercel today (Node runtime, and how the static files in `public/` and Pico CSS are served).
- [ ] Update [specs/tech-stack.md](../specs/tech-stack.md) with the chosen database and the new dependencies.
- [ ] Add two phases to [specs/roadmap.md](../specs/roadmap.md): "Async data layer" and "Deploy to Vercel". Then spec them with `/feature-spec`.

## Sources

- **Checked against Vercel's current docs (via Context7):**
  - [Vercel Functions runtimes: file system support](https://vercel.com/docs/functions/runtimes)
  - [Postgres on Vercel](https://vercel.com/docs/postgres)
  - [Storage on Vercel](https://vercel.com/docs/storage)
  - [Marketplace storage](https://vercel.com/docs/marketplace-storage)
- **From memory, not yet verified:** the Turso/libSQL details, PGlite, and the Postgres porting notes. See "Before deciding".
