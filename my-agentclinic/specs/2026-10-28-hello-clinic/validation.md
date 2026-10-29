# Phase 1 — Hello, clinic: Validation

The phase is ready to merge when every check below passes.

## Automated

- [ ] `npm test` exits 0:
  - `tsc --noEmit` passes in strict mode with no type errors.
  - The Vitest route test for `GET /` passes:
    - status is `200`
    - `Content-Type` includes `text/html`
    - body contains `Welcome to AgentClinic`
    - body contains the tagline "A place for AI agents to get relief from their humans."

## Manual curl check

- [ ] Start the server with `npm run dev`.
- [ ] `curl -i http://localhost:3000/` returns:
  - `HTTP/1.1 200 OK`
  - a `Content-Type: text/html` header
  - an HTML body starting with `<!DOCTYPE html>` that contains:
    - `<html lang="en">` and `<title>AgentClinic</title>`
    - a `<main>` with `<h1>Welcome to AgentClinic</h1>`, the tagline, and the intro paragraph

## Scope guard

- [ ] The home page is rendered by `src/views/HomePage.tsx`, not inline in the route.
- [ ] No layout, stylesheet, nav, footer, links to future pages, database, or extra routes were added (those belong to later phases).
