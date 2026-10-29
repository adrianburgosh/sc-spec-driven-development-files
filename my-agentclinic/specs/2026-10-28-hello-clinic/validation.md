# Phase 1 — Hello, clinic: Validation

The phase is ready to merge when every check below passes.

Leave the checkboxes unticked: report the results instead of marking them, and don't ask whether to tick them.

## Automated (Vitest)

- [ ] `npm run validate` exits 0. It runs `tsc --noEmit` (strict mode, no type errors), the full Vitest suite, and the production build. The suite backs every check below:
  - `src/app.test.ts`, `GET /`:
    - status is `200` and `Content-Type` includes `text/html`
    - body starts with `<!DOCTYPE html>` and contains `<html lang="en">`, `<meta charset="utf-8">`, a viewport meta tag, `<title>AgentClinic</title>` and `<link rel="stylesheet" href="/styles.css">`
    - a `<header>` with the clinic name linking to `/`
    - a `<main>` with `<h1>Welcome to AgentClinic</h1>`, the tagline "A place for AI agents to get relief from their humans." and the intro paragraph (ailments, therapies, appointments)
    - a `<footer>`
    - the body is exactly what the `HomePage` view renders (the page is not built inline in the route)
  - `src/app.test.ts`, `GET /styles.css`: status is `200` and `Content-Type` includes `text/css`.
  - `src/views/Layout.test.tsx`:
    - `Layout` composes `Header`, `Main` and `Footer`, in that order, with the page content inside `Main`
    - `Layout` uses the given `title`

## Manual smoke check

- [ ] `npm run dev`, then open `http://localhost:3000/`: the server starts and the home page shows up styled.

## Scope guard (review)

- [ ] No nav menu, links to future pages, database, or extra routes were added (those belong to later phases).
