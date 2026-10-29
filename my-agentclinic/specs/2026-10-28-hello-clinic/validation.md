# Phase 1 — Hello, clinic: Validation

The phase is ready to merge when every check below passes.

Leave the checkboxes unticked: report the results instead of marking them, and don't ask whether to tick them.

## Automated

- [ ] `npm test` exits 0:
  - `tsc --noEmit` passes in strict mode with no type errors.
  - The Vitest route test for `GET /` passes:
    - status is `200`
    - `Content-Type` includes `text/html`
    - body contains `Welcome to AgentClinic`
    - body contains the tagline "A place for AI agents to get relief from their humans."
    - body contains `<header>`, `<main>`, `<footer>` and `<link rel="stylesheet" href="/styles.css"/>`
  - The Vitest route test for `GET /styles.css` passes: status is `200` and `Content-Type` includes `text/css`.

## Manual curl check

- [ ] Start the server with `npm run dev`.
- [ ] `curl -i http://localhost:3000/` returns:
  - `HTTP/1.1 200 OK`
  - a `Content-Type: text/html` header
  - an HTML body starting with `<!DOCTYPE html>` that contains:
    - `<html lang="en">` and `<title>AgentClinic</title>`
    - a `<header>` with the clinic name linking to `/`
    - a `<main>` with `<h1>Welcome to AgentClinic</h1>`, the tagline, and the intro paragraph
    - a `<footer>`
- [ ] `curl -i http://localhost:3000/styles.css` returns `200 OK` with a `Content-Type: text/css` header.

## Scope guard

- [ ] The home page is rendered by `src/views/HomePage.tsx` inside `Layout` (`src/views/Layout.tsx`), not inline in the route.
- [ ] `Layout` is composed of `Header`, `Main` and `Footer` subcomponents.
- [ ] No nav menu, links to future pages, database, or extra routes were added (those belong to later phases).
