# Tech Stack

Guiding principle: a popular, reliable, TypeScript-first stack with as few moving parts as possible. Server-side rendering, no SPA framework.

## Language & runtime

- **TypeScript** (strict mode) everywhere.
- **Node.js** (current LTS).

## Web framework

- **[Hono](https://hono.dev/)** on Node (`@hono/node-server`).
  - Small, fast, standards-based (Fetch API `Request`/`Response`).
  - Built-in **JSX** for server-rendered HTML — typed templates with no client framework.

## Frontend

- **Server-rendered HTML** via Hono JSX.
- **Plain modern CSS** (custom properties, grid, flexbox, nesting) in a single stylesheet served statically.
- Progressive enhancement only — the site must work without client-side JavaScript; small sprinkles of vanilla JS are allowed where they clearly help.
- Target: evergreen modern browsers (latest Chrome, Firefox, Safari, Edge).
- **Responsive design, mobile-first:**
  - Every page ships with `<meta name="viewport" content="width=device-width, initial-scale=1">` (set once in the shared layout).
  - Base styles target small screens; wider screens are layered on with `min-width` media queries.
  - Fluid layouts: flexbox/grid, relative units (`rem`, `%`), `min()`/`clamp()` for widths, spacing, and type — no fixed pixel widths for layout.
  - Every page is usable from 320px wide up to large desktops with no horizontal scrolling; reference widths for checks are 360px (phone), 768px (tablet), and 1280px (desktop).
  - Responsiveness is part of every feature, not a later pass: each feature spec includes it in its scope and validation.

## Data

- **SQLite** as the database (a single file, zero ops).
- Accessed through a thin, typed data-access layer; schema created/migrated from SQL files at startup.

## Testing & quality

- **Vitest** for unit and route tests (using Hono's `app.request()` to test routes without a running server).
- `tsc --noEmit` type checking as part of the test run.
- **Vitest is the validation tool for every phase:** each automated check in a feature spec's `validation.md` is backed by a Vitest test, so a phase is validated by running the suite rather than by checking things by hand.
- `npm run validate` is the single command that validates a phase: typecheck, the full Vitest suite, and a production build. It must exit 0 before a phase is merged.
- Responsive behavior that Vitest can't see (how the page actually lays out) is checked by hand at the three reference widths as part of each phase's manual smoke check.

## Tooling

- **npm** for package management.
- **tsx** for running TypeScript in development (watch mode).
- `tsc` for production builds to `dist/`.

## Project layout (target)

```
src/
  index.ts        # server entry
  app.ts          # Hono app + routes
  views/          # JSX layouts and pages
  db/             # SQLite access + schema
public/
  styles.css
specs/            # mission, tech stack, roadmap, feature specs
```
