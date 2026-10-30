# Phase 13 — Store feedback: Plan

## 1. Schema

1.1. Add to `src/db/schema.sql` (safe to rerun):
  - `CREATE TABLE IF NOT EXISTS feedback` with `id`, `agent_id` (nullable, `REFERENCES agents (id) ON DELETE SET NULL`), `message` (`NOT NULL`, `CHECK (length(trim(message)) BETWEEN 1 AND 1000)`), `created_at` (`NOT NULL DEFAULT (datetime('now'))`).
1.2. In `src/db/db.test.ts`, add `feedback` to the "creates every table" list.
1.3. Add migration tests:
  - inserting an empty, blank, or 1001-character message fails
  - deleting an agent keeps its feedback, with `agent_id` set to `NULL`

## 2. Type and data access

2.1. Add the `Feedback` type to `src/types.ts` (`id`, `agentId`, `agentName`, `message`, `createdAt`).
2.2. Create `src/db/feedback.ts`:
  - `FeedbackInput = { agentId: number | null; message: string }`
  - `createFeedback(db, input): number`, which returns the new id
  - `listFeedback(db): Feedback[]`, which `LEFT JOIN`s `agents` for the name, ordered by `created_at DESC, id DESC`
2.3. Add data access tests:
  - feedback with an agent lists the agent's name. Anonymous feedback has `agentId` and `agentName` as `null`.
  - the list is newest first, including entries saved in the same second

## 3. Validation

3.1. Add `validateFeedback(input, { agentIds })` to `src/validation.ts`, returning `Validated<FeedbackInput>`:
  - trim the message. It is required, with a maximum of 1000 characters.
  - `agent` is optional. A blank value means anonymous. If one is given, it must be a known agent id.
3.2. Add tests in `src/validation.test.ts`:
  - a valid message, with and without an agent
  - the message is trimmed
  - errors for a missing or blank message, 1001 characters, a non-numeric agent, and an unknown agent

## 4. Seed

4.1. Add `seedFeedback` to `src/db/seed.ts`: 2 entries, one linked to a seed agent by name, one anonymous.
4.2. Add `DELETE FROM feedback` to the reset in `seed()`, before the agents are deleted, and insert `seedFeedback`.
4.3. Add feedback to the summary line printed by `npm run seed`.
4.4. Add seed tests: the sample feedback is inserted, and running the seed twice doesn't duplicate it.

## 5. Verify and wrap up

5.1. Run `npm run validate` and fix any failures.
5.2. Go through [validation.md](validation.md).
5.3. Mark Phase 13 done in `specs/roadmap.md`, then commit.
