# Phase 14 — Feedback form: Requirements

## Context

The mission's next stretch is to go from a clinic that works to one agents trust, starting with "**we listen**". Phase 13 built feedback storage: the `feedback` table, `createFeedback` / `listFeedback` in `src/db/feedback.ts`, and `validateFeedback` in `src/validation.ts`. Nothing in the browser uses it yet.

This phase gives agents a way to send feedback: a public form at `/feedback`, linked from the main nav. Phase 15 then lets staff read it.

## Scope

### In scope

- `GET /feedback`: the form.
- `POST /feedback`: validate, save, and redirect to `/feedback?sent=1`.
- A `FeedbackPage` view in `src/views/FeedbackPage.tsx`.
- A "Feedback" link in the main nav, just before "Staff".
- Tests: routes, nav and the shared page checks.

### Out of scope

- Staff reading feedback at `/staff/feedback`, and the feedback count on the staff dashboard (Phase 15).
- A "Send feedback" link on the agent dashboard, or a home page shortcut.
- Client-side JavaScript (for example a live character counter), email notifications and anti-spam (roadmap "Later").
- Any change to the `feedback` table or `validateFeedback`, which Phase 13 already settled.

## Behaviour

| Request | Response |
| --- | --- |
| `GET /feedback` | 200. A form with an **Agent** select (first option "Stay anonymous", value `""`, then every agent by name) and a **Message** textarea (`maxlength="1000"`, `required`). |
| `GET /feedback?agent=<id>` | Same, with that agent preselected. An unknown or malformed id just preselects nothing. |
| `GET /feedback?sent=1` | Same, with an empty form and a `role="status"` thank-you message above it. |
| `POST /feedback` (valid) | Saves through `createFeedback`, then `303` to `/feedback?sent=1`. |
| `POST /feedback` (invalid) | `400`. Shows the form again with the `FormError` summary, field errors from `validateFeedback` (`message`, `agent`) and the values the user typed. Nothing is saved. |

The page uses `Layout` with `title="Feedback · AgentClinic"` and `current="/feedback"`, so the nav marks it as the current page.

## Decisions

- **Follow the booking form's patterns.** Use `readForm`, `validateFeedback(values, { agentIds })`, `Field` / `controlProps` / `FormError`, `303` redirect-after-POST, and `400` with the typed values kept. Students learn one pattern, used everywhere.
- **Thank them on the same page.** `/feedback?sent=1` shows the thanks above a fresh form, like `/appointments?booked=<id>`. A separate thank-you page would be one more page with nothing on it.
- **`?sent=1` doesn't point to a saved row.** The thanks doesn't show the message back, so there's no id to look up, and no one can view someone else's feedback by guessing ids.
- **Anonymous by default.** "Stay anonymous" is the first option, so sending feedback never requires choosing an agent. `?agent=<id>` preselects an agent, like `/appointments/new?agent=<id>` does.
- **Ignore a bad `?agent=`.** An unknown agent in the query string isn't the visitor's mistake, so it preselects nothing instead of showing an error. Unknown agents are still rejected on `POST`.
- **`maxlength="1000"` matches the server rule.** The browser stops long messages early, and `validateFeedback` (plus the database `CHECK`) still enforce the limit.
- **Nav link before "Staff".** Feedback is for agents, so it goes with the agent pages, and "Staff" stays last.
- **No new dependencies** (tech-stack.md).

## References

- [specs/mission.md](../mission.md): "We listen"; small phases that end with something visible in the browser.
- [specs/tech-stack.md](../tech-stack.md): plain HTML `POST` forms with server-side validation and a redirect; Hono JSX views, one per file; every page added to `src/pages.test.ts`.
- [specs/roadmap.md](../roadmap.md): Phase 14.
- [specs/2026-10-30-store-feedback/](../2026-10-30-store-feedback/requirements.md): the data and validation this phase builds on.
