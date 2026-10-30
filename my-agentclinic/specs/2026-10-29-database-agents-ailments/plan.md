# Phase 2 — Layout, database, agents & ailments: Plan

## 1. Pico CSS

1.1. Install `@picocss/pico` (v2).
1.2. Serve it at `GET /pico.min.css` from `node_modules/@picocss/pico/css/pico.min.css` (`serveStatic` with a `path`).
1.3. In `Layout`, link `/pico.min.css` before `/styles.css`, and set `data-theme="light"` on `<html>`.
1.4. Rework `public/styles.css` into the clinic theme:
  - map the clinic colors and fonts onto Pico variables (`--pico-primary`, `--pico-primary-hover`, `--pico-background-color`, `--pico-font-family`, …)
  - remove what Pico already covers (the `box-sizing` reset, base `body`, `img`/`svg`/`video` sizing, base heading styles)
  - keep the clinic touches: the teal header bar, the brand, the tagline accent, the main card, and the sticky footer layout
1.5. Extend `src/app.test.ts`: `GET /pico.min.css` returns `200` and `text/css`; `GET /` links `/pico.min.css` before `/styles.css`.
1.6. Run `npm run validate`, check the home page at 360/768/1280px, then commit.

## 2. Navigation

2.1. Add a Pico nav to `src/views/Header.tsx`: `<nav aria-label="Main">` with the brand in a first `<ul>` and links to `/`, `/agents` and `/ailments` in a second `<ul>`.
2.2. `Layout` takes an optional `current` prop (the active path) and passes it to `Header`, which sets `aria-current="page"` on the matching link.
2.3. In `styles.css`, let the nav wrap so the links drop below the brand on phones and sit beside it from `40rem` up. Style `[aria-current="page"]` as the active link.
2.4. Extend `src/views/Layout.test.tsx`: the nav links render, and `aria-current` follows `current`.
2.5. Run `npm run validate`, then commit.

## 3. SQLite & migration

3.1. Move to Node 24 LTS: add `.nvmrc` (`24`), set `engines.node` to `>=24`, and bump `@types/node` to 24. Use the built-in `node:sqlite` (`DatabaseSync`).
3.2. Create `src/db/schema.sql` with the `agents` and `ailments` tables (`CREATE TABLE IF NOT EXISTS`, plus a `CHECK` on `severity`).
3.3. Create `src/db/index.ts`:
  - `openDb(path)` opens the database, enables foreign keys, and runs `schema.sql` (the migration)
  - `DB_PATH` env var, defaulting to `data/agentclinic.db`; the `data/` folder is created if missing
3.4. Make sure the build can find `schema.sql`: resolve it relative to the project root (not `dist/`).
3.5. Add `data/` to `.gitignore`.
3.6. Add `src/db/db.test.ts`: opening `:memory:` creates both tables, and running the migration a second time doesn't throw.
3.7. Run `npm run validate`, then commit.

## 4. Data access & seed

4.1. Create `src/db/types.ts` with `Agent` and `Ailment` types.
4.2. Create `src/db/agents.ts` (`listAgents(db)`, `getAgent(db, id)`) and `src/db/ailments.ts` (`listAilments(db)`), using prepared statements and returning typed rows sorted by name.
4.3. Create `src/db/seed.ts`:
  - `seed(db)` wipes and inserts about 5 agents and 6 ailments with playful copy
  - a CLI entry that opens `DB_PATH` and seeds it
4.4. Add the npm script `seed`: `tsx src/db/seed.ts`.
4.5. Extend `src/db/db.test.ts`: after `seed`, the counts match, running `seed` twice doesn't duplicate rows, `getAgent` returns `undefined` for an unknown id, and the lists come back sorted by name.
4.6. Run `npm run validate`, then commit.

## 5. App factory

5.1. Change `src/app.tsx` to export `createApp(db)` instead of a module-level `app`.
5.2. `src/index.ts` opens the file database and serves `createApp(db)`.
5.3. Update `src/app.test.ts` to build the app from a seeded in-memory database. The existing tests keep passing.
5.4. Run `npm run validate`, then commit.

## 6. Agents pages

6.1. Create `src/views/AgentsPage.tsx`: a list of Pico `<article>` cards (name, model, role) that link to `/agents/:id`, with an empty state.
6.2. Create `src/views/AgentPage.tsx`: an `<article>` profile (name, model, role, bio, formatted check-in date) and a back link to `/agents`.
6.3. Create `src/views/AgentNotFoundPage.tsx`: a friendly message and a link to `/agents`.
6.4. Routes: `GET /agents` and `GET /agents/:id`. A non-numeric or unknown id returns `c.html(<AgentNotFoundPage />, 404)`.
6.5. Add a `.card-grid` class in `styles.css`: one column on phones, `repeat(auto-fill, minmax(min(100%, 16rem), 1fr))` on wider screens. Pico's own `.grid` would force equal columns.
6.6. Add route tests (see `validation.md`), then run `npm run validate` and commit.

## 7. Ailments page

7.1. Create `src/views/AilmentsPage.tsx`: ailment `<article>` cards in `.card-grid` (name, description, severity badge), with an empty state.
7.2. Route: `GET /ailments`.
7.3. Add `.badge` styles in `styles.css` (Pico has none) for `mild` / `moderate` / `severe`, in clinic colors at readable contrast.
7.4. Add route tests, then run `npm run validate` and commit.

## 8. Wrap-up

8.1. Run through `validation.md` (automated, manual smoke and responsive check, scope guard).
8.2. Mark Phase 2 as done in `specs/roadmap.md` if that's the convention, update the changelog, and commit.
