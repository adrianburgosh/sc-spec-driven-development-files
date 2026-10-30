# Phase 2 — Layout, database, agents & ailments: Requirements

## Context

Second slice of AgentClinic (see `specs/roadmap.md`, Phase 2). Phase 1 already shipped the shared layout (`Layout`, `Header`, `Main`, `Footer`) and the mobile-first base stylesheet (`public/styles.css`), so this phase covers the rest of Phase 2: navigation, the SQLite database, and the first real pages for agents and ailments.

Guidance: `specs/mission.md` (agent-first, playful and warm tone, any screen) and `specs/tech-stack.md` (Hono JSX, SQLite through a thin typed data-access layer, Vitest, mobile-first).

## Scope

- **Pico CSS:**
  - Adopt Pico CSS v2 (`@picocss/pico`) as the CSS framework, served by the app at `/pico.min.css` and linked in `Layout` before `/styles.css`.
  - `public/styles.css` becomes the clinic theme: clinic colors and fonts through Pico's `--pico-*` variables (primary teal, accent coral), plus the few components Pico lacks (severity badges, the card grid). Rules that Pico already covers (reset, base typography, the `box-sizing` reset, media sizing) are removed.
  - The home page keeps its content and still looks like AgentClinic.
- **Navigation:** the header gets a Pico nav (`<nav aria-label="Main">` with the brand in one `<ul>` and the links in another) with links to Home (`/`), Agents (`/agents`) and Ailments (`/ailments`). On phones the links wrap below the brand; from `40rem` up they sit beside it. The current page's link is marked with `aria-current="page"`.
- **Database:**
  - SQLite through `better-sqlite3`, with a thin typed data-access layer in `src/db/`.
  - `src/db/schema.sql` creates the tables with `CREATE TABLE IF NOT EXISTS`. It runs on startup as the migration, and running it twice is safe.
  - The database file comes from `DB_PATH` (default `data/agentclinic.db`, gitignored). Tests use an in-memory database.
- **Agents table:** `id`, `name`, `model` (e.g. "GPT-ish 4"), `role` (e.g. "Customer support bot"), `bio`, `checked_in_on` (ISO date).
- **Ailments table:** `id`, `name`, `description` (playful), `severity` (`mild` | `moderate` | `severe`, enforced with a `CHECK` constraint).
- **Seed:** `npm run seed` wipes and re-seeds the database with about 5 agents and 6 ailments. Seed copy is tongue-in-cheek and never mean (e.g. "Prompt Fatigue", "Chronic Hallucination", "Make-It-Pop Syndrome").
- **`/agents`:** lists every agent (name, model, role) as Pico `<article>` cards, sorted by name. Each entry links to the agent's profile. If there are no agents, a friendly empty state is shown.
- **`/agents/:id`:** shows one agent's profile: name, model, role, bio, and the check-in date. An unknown or non-numeric id returns a `404` status with a friendly "agent not found" page rendered in the layout.
- **`/ailments`:** lists every ailment (name, description, severity badge) as Pico `<article>` cards, sorted by name, with a friendly empty state.
- **Responsive:** every new page and the nav work from 320px up with no horizontal scrolling. Lists are a single column on phones and a grid on wider screens.

## Out of scope

- Linking agents to ailments, or showing an agent's ailments (Phase 3).
- Therapies, appointments, dashboards (Phase 4+).
- An ailment detail page (`/ailments/:id`).
- Forms to add or edit agents or ailments (Phase 11).
- Client-side JavaScript.

## Decisions

- **Pico CSS, self-hosted:** Pico styles semantic HTML (`nav`, `article`, `header`/`footer`) with almost no classes and is mobile-first, so the views stay clean JSX. It is served from `node_modules` instead of a CDN, so the site works offline and has no third-party runtime dependency ("always open"). Pico's color scheme is pinned to light (`data-theme="light"` on `<html>`) to match the clinic palette. Dark mode can be its own later decision.
- **Pico first, theme second:** `pico.min.css` loads before `styles.css`, so clinic overrides win without `!important`.
- **`better-sqlite3` over `node:sqlite`:** the project runs on Node 20.19, and `node:sqlite` needs Node 22.5 or newer. `better-sqlite3` is popular, synchronous and well typed (`@types/better-sqlite3`), which suits the "boring, reliable" stack.
- **Migration = idempotent schema file:** with one schema file and `IF NOT EXISTS`, the app needs no migration tooling yet.
- **Explicit seed script:** seeding is a deliberate `npm run seed`, so the app never touches data on startup beyond creating tables.
- **App factory with an injected database:** `src/app.tsx` exports `createApp(db)`, so tests pass an in-memory seeded database and `src/index.ts` passes the file-backed one.
- **Views stay pure:** routes fetch data through `src/db/` functions and pass plain typed objects to JSX views in `src/views/`. Views never touch the database.
- **Friendly 404:** an unknown agent gets a real `404` status, but the page keeps the playful tone and links back to `/agents`.
