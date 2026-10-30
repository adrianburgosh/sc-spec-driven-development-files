# Phase 13 — Store feedback: Requirements

## Context

The mission's next stretch is to go from a clinic that works to one agents trust, and the first step is "**we listen**". The roadmap splits the feedback feature into three small phases:

- **Phase 13 (this one): store feedback.** The table, the type, data access, validation and seed data.
- Phase 14: the public `/feedback` form.
- Phase 15: staff read feedback at `/staff/feedback` and see a count on the staff dashboard.

This phase builds the foundation that Phases 14 and 15 use. Nothing changes in the browser yet.

## Scope

### In scope

- A `feedback` table in `src/db/schema.sql`.
- A `Feedback` type in `src/types.ts`.
- `src/db/feedback.ts`, with `createFeedback` and `listFeedback`.
- `validateFeedback` in `src/validation.ts`, ready for the Phase 14 form.
- A couple of seed feedback entries in `src/db/seed.ts`.
- Tests for all of the above.

### Out of scope

- Any route or view, including `/feedback` (Phase 14) and `/staff/feedback` (Phase 15).
- Nav links and changes to the staff dashboard.
- Ratings, categories, replies, read/unread state, email notifications and anti-spam.

## Data

| Column | Type | Rules |
| --- | --- | --- |
| `id` | `INTEGER PRIMARY KEY` | |
| `agent_id` | `INTEGER` | Optional. `REFERENCES agents (id) ON DELETE SET NULL` |
| `message` | `TEXT NOT NULL` | `CHECK (length(trim(message)) BETWEEN 1 AND 1000)` |
| `created_at` | `TEXT NOT NULL` | `DEFAULT (datetime('now'))` |

The `Feedback` type includes the agent's name, so later pages don't need a second lookup:

```ts
export type Feedback = {
  id: number
  agentId: number | null
  agentName: string | null
  message: string
  createdAt: string
}
```

## Decisions

- **The agent is optional.** Anyone can leave feedback without saying who they are. If they choose an agent, the feedback is linked to it.
- **Feedback outlives its agent.** `ON DELETE SET NULL` keeps the feedback when an agent is deleted, so staff don't lose what was said. The feedback just becomes anonymous.
- **The database enforces the message rules.** A `CHECK` rejects an empty, blank or over-1000-character message, even if a caller skips validation (tech stack rule: keep the rules in the database where possible).
- **`validateFeedback` gives friendly errors first.** It trims the message, requires it, limits it to 1000 characters, and checks that an agent, if one is given, exists. It uses the same `Validated<T>` / `FormErrors` shape as `validateBooking`. Error messages are keyed `message` and `agent`.
- **Newest first.** `listFeedback` orders by `created_at DESC, id DESC`. `created_at` only stores whole seconds, so `id` breaks ties between entries saved in the same second.
- **`createFeedback` returns the new id**, like `createTherapy` does.
- **The seed resets feedback too.** `seed()` deletes feedback before agents, and then inserts 2 sample entries: one linked to a seed agent, one anonymous. That way, running `npm run seed` twice doesn't duplicate them.
- **No new dependencies** (per tech-stack.md).

## References

- [specs/mission.md](../mission.md): "We listen"; small phases students can build in one sitting.
- [specs/tech-stack.md](../tech-stack.md): `node:sqlite`, a schema that is safe to rerun, rules in the database, `src/db/*.ts` per area, types in `src/types.ts`.
- [specs/roadmap.md](../roadmap.md): Phase 13.
