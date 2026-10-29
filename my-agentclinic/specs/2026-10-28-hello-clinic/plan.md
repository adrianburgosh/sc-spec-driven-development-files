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

## 6. One file per layout subcomponent

6.1. Move each layout subcomponent out of `Layout.tsx` into its own file:
  - `src/views/Header.tsx` exporting `Header`
  - `src/views/Main.tsx` exporting `Main`
  - `src/views/Footer.tsx` exporting `Footer`
6.2. `Layout.tsx` imports `Header`, `Main` and `Footer` and keeps only the document shell and their composition.
6.3. No change to the rendered HTML: run `npm test` and the manual curl check, then commit.

## 7. Validation through Vitest

7.1. Add a `validate` npm script: `npm test && npm run build`.
7.2. Move the manual curl checks into `src/app.test.ts` (`GET /`): doctype, `lang`, charset and viewport metas, title, stylesheet link, header link to `/`, `<main>` with heading/tagline/intro, footer, and that the body is exactly what `HomePage` renders.
7.3. Add `src/views/Layout.test.tsx`: `Layout` composes `Header`, `Main` and `Footer` in order, with the content inside `Main`, and uses the given `title`.
7.4. Rewrite `validation.md` around `npm run validate`, keeping only a manual smoke check and a scope review.
7.5. Run `npm run validate`, then commit.

## 8. Responsive design

8.1. Make `public/styles.css` mobile-first:
  - a `--gutter` custom property (`1rem` on small screens, `2rem` from `40rem` up via a `min-width` media query) used for header, main, and footer spacing
  - `.site-main` sized with `width: min(100% - 2 * var(--gutter), var(--max-width))` and centered, so it never overflows the viewport
  - fluid type with `clamp()` for the heading, brand, and tagline
  - `overflow-wrap: break-word` on the body and `max-width: 100%` on media, so long words and future images can't cause horizontal scrolling
8.2. Assert in `src/app.test.ts` that the viewport meta tag is exactly `width=device-width, initial-scale=1`.
8.3. Add a manual responsive check to `validation.md` at 360px, 768px, and 1280px.
8.4. Run `npm run validate` and the manual responsive check, then commit.
