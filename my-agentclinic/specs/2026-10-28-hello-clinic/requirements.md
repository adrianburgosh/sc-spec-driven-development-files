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
- npm scripts: `dev` (tsx watch), `test` (typecheck + Vitest), `start` (run the built server), keeping `build`.
- One Vitest route test for `GET /` using `app.request()`.

## Out of scope

- Shared layout, header/nav/footer, stylesheet (Phase 2).
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
