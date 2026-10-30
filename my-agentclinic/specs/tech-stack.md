# Tech stack

A server-rendered TypeScript web app. No client-side framework and no build step for the browser: the server sends finished HTML.

## Runtime and language

- **Node.js 24** (pinned in `.nvmrc`, `engines` in `package.json`).
- **TypeScript**, `strict` mode, ES modules (`"type": "module"`, `nodenext` resolution, so imports end in `.js`).

## Web

- **[Hono](https://hono.dev)** with **`@hono/node-server`**: routing, forms and static files.
- **Hono JSX** (`jsxImportSource: hono/jsx`) for views in `src/views/`, one component per file, with props as named types.
- The app is built by `createApp(db, { now })` in `src/app.tsx`, so tests can pass an in-memory database and a fixed clock. Staff routes are mounted at `/staff` from `src/staff.tsx`.
- Forms are plain HTML `POST`s with server-side validation (`src/validation.ts`). After a successful `POST`, redirect. On errors, show the form again with messages next to the fields.

## Data

- **SQLite** through Node's built-in **`node:sqlite`** (`DatabaseSync`). No ORM.
- The schema is `src/db/schema.sql`. It runs on every startup, so every statement must be safe to repeat (`CREATE TABLE IF NOT EXISTS`, ...).
- Rules belong in the database where possible: `CHECK` constraints, foreign keys, and unique indexes (for example, one booked appointment per slot).
- Typed data access lives in `src/db/*.ts`, one file per area. Shared types are in `src/types.ts`, so views never import from `src/db/`.
- The database file is `data/agentclinic.db` (git-ignored), or `DB_PATH`. Run `npm run seed` for demo data.

## Styling

- **[Pico CSS](https://picocss.com)**, served from `node_modules` at `/pico.min.css`, plus the clinic theme in `public/styles.css`.
- Mobile-first and responsive. Text meets WCAG AA contrast, and focus rings stay visible.

## Testing and checks

- **Vitest** for route, view, data and helper tests, next to the code (`*.test.ts`).
- `src/pages.test.ts` checks every page: it renders in the layout, has exactly one `<h1>`, and its forms are accessible. Add each new page to it.
- `npm test` runs `tsc --noEmit` and then Vitest. `npm run validate` also runs the build. A phase is done only when `npm run validate` passes.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Run with reload (`tsx watch`) |
| `npm test` | Type-check and run the tests |
| `npm run build` | Compile to `dist/` and copy `schema.sql` |
| `npm start` | Run the built app |
| `npm run validate` | Tests, then build |
| `npm run seed` | Load demo data |

## Choices for the next features

We add **no new dependencies** for feedback, reviews and About us.

- **Feedback** is stored in SQLite and read by staff under `/staff`. No email.
- **Reviews** are stored in SQLite with a status (`pending`, `approved`, `rejected`). Only approved reviews are shown publicly.
- **Map**: an embedded OpenStreetMap `<iframe>` (no API key, no JavaScript), with a plain link to the full map below it.

## Known gaps

- **`/staff` has no login.** Anyone who knows the URL can edit clinic data and moderate reviews. That's fine for a course project running locally. Add authentication before running this anywhere public (see the "Later" section in [roadmap.md](roadmap.md)).
- **No anti-spam** on the public feedback and review forms.
