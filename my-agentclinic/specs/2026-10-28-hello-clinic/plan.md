# Phase 1 — Hello, clinic: Plan

## 1. Dependencies & scripts

1.1. Install runtime deps: `hono`, `@hono/node-server`.
1.2. Install dev deps: `tsx`, `vitest`, `@types/node`.
1.3. Configure `tsconfig.json`: strict mode, `"jsx": "react-jsx"`, `"jsxImportSource": "hono/jsx"`, output to `dist/`.
1.4. Add npm scripts:
  - `dev`: `tsx watch src/index.ts`
  - `test`: `tsc --noEmit && vitest run`
  - `build`: `tsc`
  - `start`: `node dist/index.js`

## 2. App & server

2.1. Create `src/app.tsx` exporting a Hono app with a `GET /` route (the page content comes in group 3).
2.2. Replace the placeholder `src/index.ts` with a `@hono/node-server` `serve()` call that uses the app, reads `PORT` (default `3000`), and logs the URL.

## 3. Minimal AgentClinic home page

3.1. Create `src/views/HomePage.tsx`, a JSX component that renders a complete HTML document:
  - `<!DOCTYPE html>`, `<html lang="en">`, `<meta charset="utf-8">`, a viewport meta tag, `<title>AgentClinic</title>`
  - `<main>` containing `<h1>Welcome to AgentClinic</h1>`
  - one playful tagline taken from the mission: "A place for AI agents to get relief from their humans."
  - one short, warm intro paragraph about what the clinic offers agents (ailments, therapies, appointments)
3.2. Render `HomePage` from `GET /` with `c.html()`.
3.3. Keep the page minimal: no stylesheet, nav, footer, or links to pages that don't exist yet.

## 4. Route test & verification

4.1. Add `src/app.test.ts`: `GET /` via `app.request('/')` returns:
  - status 200
  - an HTML content type
  - a body that contains `Welcome to AgentClinic` and the tagline
4.2. Run `npm test` (typecheck + Vitest) and fix any failures.
4.3. Run through `validation.md`, then commit the phase.

## 5. Main layout & stylesheet

5.1. Create `src/views/Layout.tsx` exporting a `Layout` component (props: `title`, `children`) that renders the full HTML document and composes three subcomponents:
  - `Header`: `<header>` with the clinic name linking to `/`
  - `Main`: `<main>` wrapping the page content (`children`)
  - `Footer`: `<footer>` with a short, warm sign-off
5.2. Move the document shell (`<!DOCTYPE html>`, `<html lang="en">`, `<head>` metas, `<title>`) from `HomePage` into `Layout`; `HomePage` imports `Layout` and only provides its own content.
5.3. Create `public/styles.css`: clinic colors and typography as CSS custom properties, plus base styles for the header, main and footer.
5.4. Serve `public/` statically from the app (`serveStatic` from `@hono/node-server/serve-static`) and link the stylesheet from `Layout` with `<link rel="stylesheet" href="/styles.css">`.
5.5. Extend `src/app.test.ts`:
  - `GET /` contains `<header>`, `<main>`, `<footer>` and the stylesheet link
  - `GET /styles.css` returns status 200 with a `text/css` content type
5.6. Run `npm test` and the manual curl check, then commit.
