# Phase 2 — Layout, database, agents & ailments: Validation

The phase is ready to merge when every check below passes.

Leave the checkboxes unticked: report the results instead of marking them, and don't ask whether to tick them.

## Automated (Vitest)

- [ ] `npm run validate` exits 0. It runs `tsc --noEmit` (strict mode, no type errors), the full Vitest suite, and the production build. The suite backs every check below:
  - `src/db/db.test.ts`:
    - opening an in-memory database creates the `agents` and `ailments` tables
    - running the migration twice doesn't throw
    - inserting an ailment with an invalid `severity` fails (the `CHECK` constraint)
    - after `seed`, the agent and ailment counts match the seed data, and running `seed` twice doesn't duplicate rows
    - `listAgents` and `listAilments` return rows sorted by name; `getAgent` returns `undefined` for an unknown id
  - `src/views/Layout.test.tsx`:
    - the header has a `<nav>` with links to `/`, `/agents` and `/ailments`
    - the link matching `current` has `aria-current="page"`, and no other link does
  - `src/app.test.ts` (app built with `createApp` over a seeded in-memory database):
    - `GET /` and `GET /styles.css` still pass their Phase 1 checks
    - `GET /pico.min.css`: status `200` and `Content-Type` includes `text/css`
    - `GET /`: `<html>` has `data-theme="light"`, and `<link rel="stylesheet" href="/pico.min.css">` comes before the `/styles.css` link
    - `GET /agents`: status `200`, HTML, and it contains every seeded agent's name with a link to `/agents/:id`
    - `GET /agents/:id` for a seeded agent: status `200`, and it shows the agent's name, model, role, bio and check-in date
    - `GET /agents/999` and `GET /agents/not-a-number`: status `404`, a friendly "not found" message rendered in the layout, and a link to `/agents`
    - `GET /ailments`: status `200`, and it contains every seeded ailment's name, description and severity
    - `GET /agents` and `GET /ailments` against an empty database show the empty-state message

## Manual smoke check

- [ ] `npm run seed`, then `npm run dev`: `/`, `/agents`, an agent profile, `/ailments` and an unknown agent id all render styled with Pico and in the clinic colors (teal primary, coral accent), not Pico's default blue. The nav highlights the current page.
- [ ] Restart the server: the data persists and the startup migration doesn't error.
- [ ] Responsive check: at 360px (phone), 768px (tablet), and 1280px (desktop) wide, the nav, agent cards, agent profile and ailment cards fit the viewport with no horizontal scrolling. Lists are a single column on phones and a grid on wider screens, and text stays readable.

## Scope guard (review)

- [ ] No agent–ailment links, therapies, appointments, dashboards, ailment detail page, edit forms, or client-side JavaScript were added (those belong to later phases).
- [ ] Views receive plain data and never import from `src/db/`.
- [ ] Pico is served locally (no CDN `<link>`), and `styles.css` only themes or extends Pico without re-implementing what it already provides.
- [ ] `data/` is gitignored, and no database file is committed.
