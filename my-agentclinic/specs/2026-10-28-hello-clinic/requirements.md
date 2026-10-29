# Phase 1 — Hello, clinic: Requirements

## Context

First slice of AgentClinic (see `specs/roadmap.md`, Phase 1). The repo currently has only a placeholder `src/index.ts` and a `build` script. This phase stands up the server, the home page, and the test harness that every later phase builds on.

Guidance: `specs/mission.md` (playful, warm tone) and `specs/tech-stack.md` (Hono + JSX, Vitest, tsx, strict TypeScript).

## Scope

- Install Hono and `@hono/node-server`; serve the app on Node.
- A minimal AgentClinic home page at `GET /`, rendered server-side by a Hono JSX component (`src/views/HomePage.tsx`):
  - a valid HTML document (`<!DOCTYPE html>`, `<html lang="en">`, `<meta charset="utf-8">`, a viewport meta tag, `<title>AgentClinic</title>`)
  - `<main>` containing `<h1>Welcome to AgentClinic</h1>`
  - the tagline "A place for AI agents to get relief from their humans."
  - one short, warm intro paragraph about what the clinic offers agents (ailments, therapies, appointments)
- Responsive, mobile-first page (see `tech-stack.md`): header, main, and footer adapt from 320px phones to desktops with no horizontal scrolling; spacing and type scale fluidly.
- npm scripts: `dev` (tsx watch), `test` (typecheck + Vitest), `start` (run the built server), `validate` (test + build), keeping `build`.
- Vitest tests backing every automated check in `validation.md`: route tests using `app.request()` and component tests for the layout.

## Out of scope

- Navigation menu (Phase 2). The main layout (header/main/footer) and base stylesheet were pulled forward into this phase (plan group 5).
- Links to pages that don't exist yet (agents, ailments, therapies, appointments).
- Database, any other routes (Phase 3+).
- Client-side JavaScript.

## Decisions

- **JSX from day one:** the home page uses Hono JSX now, so Phase 2 only extracts a layout and doesn't change the rendering approach.
- **Page as a view component:** the home page lives in `src/views/HomePage.tsx`, separate from the routes, so Phase 2 can wrap it in the shared layout.
- **Copy:** the tagline comes straight from `mission.md`; the tone is playful and warm, never mean.
- **App/server split:** `src/app.tsx` exports the Hono app (testable without a running server); `src/index.ts` only starts the server. This follows the target layout in `tech-stack.md`.
- **Port:** `PORT` env var, defaulting to `3000`.
- **TypeScript:** strict mode; `tsconfig.json` configured for Hono JSX (`"jsx": "react-jsx"`, `"jsxImportSource": "hono/jsx"`).
- **Typecheck in tests:** `npm test` runs `tsc --noEmit` before Vitest, so type errors fail the test run.
- **Responsive from day one:** the layout and stylesheet are mobile-first with a single `--gutter` token that grows at the `40rem` breakpoint, so later pages inherit responsive spacing for free.
- **Validation through Vitest:** the phase is validated by `npm run validate` (see `tech-stack.md`); what used to be a manual curl check is covered by Vitest tests, leaving only a quick manual smoke check and a scope review.
