# Changelog

## 2026-10-29

- Move the `Agent`/`Ailment` types to `src/types.ts` so views don't import from `src/db/`, and fix stale `tech-stack.md` text (42d1769)
- Tighten Phase 2 tests so they fail when sorting, dates, severities or nav links break (175909f)
- Meet WCAG AA text contrast and show a visible focus ring in the header (bba7146)
- Run the app from any working directory: schema and static paths resolve from the code (48733ed)
- Declare view component props as named types (68ed21b)
- Add the `/ailments` page with mild/moderate/severe badges (95091f4)
- Add the `/agents` list and `/agents/:id` profile pages, with a friendly 404 (6ca473f)
- Build the app with `createApp(db)` so tests use an in-memory database (fd5fc29)
- Add typed data access and the `npm run seed` script (25ee922)
- Add SQLite via Node 24's built-in `node:sqlite`, with a startup migration (b2fa0d7)
- Add the main nav with a current-page marker (49c1430)
- Adopt Pico CSS with the clinic color theme (dc9c0e7)
- Add the Phase 2 feature spec and record Pico CSS in the tech stack (ef4913c)
- Merge the roadmap's early phases into Phase 2 and renumber the rest (5c8ed11)
- Add `CHANGELOG.md` and the `/changelog` project skill (c3aa647)
- Make the web UI responsive (mobile-first) (5e2d046)
- Validate phases through Vitest and `npm run validate` (87e2952)
- Split the layout's `Header`, `Main` and `Footer` into their own files (2946681)
- Add the main layout (header/main/footer) and base stylesheet (e5de0fa)
- Implement Phase 1 (Hello, clinic): Hono server, home page and route test (9524d99)
- Add the Phase 1 (Hello, clinic) feature spec: requirements, plan and validation (d4f0634)

## 2026-10-28

- Add the AgentClinic constitution specs: mission, tech stack and roadmap (1c6e140)
- Add the AgentClinic project scaffold (606575b)
