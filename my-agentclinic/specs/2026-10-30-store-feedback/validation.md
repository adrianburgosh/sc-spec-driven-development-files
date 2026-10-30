# Phase 13 — Store feedback: Validation

The phase is ready to merge when every check below passes.

## Automated

- [ ] `npm run validate` exits 0 (`tsc --noEmit`, Vitest, then the build).
- [ ] The migration tests pass:
  - the `feedback` table is created, and running the migration twice keeps existing feedback
  - an empty, blank, or 1001-character message is rejected by the database
  - deleting an agent keeps its feedback, with `agent_id` set to `NULL`
- [ ] The data access tests pass:
  - `createFeedback` returns the new id
  - `listFeedback` is newest first, with ties broken by id
  - feedback with an agent includes the agent's name. Anonymous feedback has `null` for `agentId` and `agentName`.
- [ ] The validation tests pass:
  - a valid message with no agent, and with a known agent
  - the message is trimmed
  - clear errors for a missing or blank message, a message over 1000 characters, and an unknown or malformed agent
- [ ] The seed tests pass: 2 feedback entries (one linked, one anonymous), with no duplicates after seeding twice.

## Manual database check

- [ ] Run `npm run seed`. The summary line mentions feedback.
- [ ] Run `sqlite3 data/agentclinic.db "SELECT id, agent_id, message, created_at FROM feedback;"`. It shows the 2 seed rows.
- [ ] Run `sqlite3 data/agentclinic.db "INSERT INTO feedback (message) VALUES ('');"`. It fails with a `CHECK constraint failed` error.
- [ ] Run `npm run dev`. The existing pages still load (for example `/`, `/agents` and `/staff`).

## Scope guard

- [ ] No new routes, views, nav links or staff dashboard changes (those come in Phases 14 and 15).
- [ ] No new dependencies in `package.json`.
- [ ] Views don't import from `src/db/`. `Feedback` lives in `src/types.ts`.
- [ ] `specs/roadmap.md` marks Phase 13 as done.
