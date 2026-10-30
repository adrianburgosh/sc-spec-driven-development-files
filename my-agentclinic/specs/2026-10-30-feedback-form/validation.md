# Phase 14 — Feedback form: Validation

The phase is ready to merge when every check below passes.

## Automated

- [ ] `npm run validate` exits 0 (`tsc --noEmit`, Vitest, then the build).
- [ ] `GET /feedback` tests pass:
  - "Stay anonymous" is the first agent option, followed by every agent
  - `?agent=<id>` preselects that agent, and `?agent=999` preselects nothing
  - the `role="status"` thanks shows for `?sent=1` and not otherwise
- [ ] `POST /feedback` tests pass:
  - a valid anonymous message and a valid message from a known agent each return `303` with `Location: /feedback?sent=1` and save exactly one row, with the trimmed message and the right `agentId`
  - a blank message, a 1001-character message, and an unknown agent each return `400` with the field error, keep the typed message in the textarea, and save no row
- [ ] The nav test includes `<a href="/feedback">Feedback</a>` just before Staff, and `/feedback` has `aria-current="page"` on that link.
- [ ] `src/pages.test.ts` covers "feedback form", "feedback form (sent)", "feedback form (invalid)" and "feedback form (empty clinic)", and all of their layout, `<h1>`, label and button checks pass.

## Manual browser check

- [ ] Run `npm run seed`, then `npm run dev`, and open `http://localhost:3000/feedback`. The nav shows "Feedback", marked as the current page.
- [ ] Submit an empty message. The browser's `required` check stops it. Remove `required` in dev tools and submit again: the page comes back with the summary and the message error.
- [ ] Send a message as "Stay anonymous". You land on `/feedback?sent=1` with the thanks and an empty form.
- [ ] Open `/feedback?agent=1`. Agent 1 is preselected. Send a message.
- [ ] Narrow the window to phone width (about 375px). The form fits with no sideways scrolling.
- [ ] Fill in and send the form using only the keyboard (Tab, arrow keys, Enter), with the focus ring visible on each control.
- [ ] `sqlite3 data/agentclinic.db "SELECT agent_id, message FROM feedback ORDER BY id DESC LIMIT 2;"` shows the two messages: one with agent `1`, and one with an empty `agent_id` (anonymous).

## Scope guard

- [ ] No `/staff/feedback` route and no staff dashboard changes (Phase 15).
- [ ] No client-side JavaScript and no new dependencies in `package.json`.
- [ ] No changes to `src/db/schema.sql`, `src/db/feedback.ts` or `validateFeedback`.
- [ ] `FeedbackPage` imports types from `src/types.ts` and `src/validation.ts`, never from `src/db/`.
- [ ] `specs/roadmap.md` marks Phase 14 as `✅ Done`.
