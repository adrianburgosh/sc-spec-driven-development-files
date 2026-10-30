# Phase 14 — Feedback form: Plan

## 1. FeedbackPage view

1.1. Create `src/views/FeedbackPage.tsx` with a named props type: `agents: Agent[]`, `values: FormValues`, `errors: FormErrors` and `sent: boolean`.
1.2. Render it in `Layout` (`title="Feedback · AgentClinic"`, `current="/feedback"`):
  - `<h1>Send us feedback</h1>` and a short, warm intro in the clinic's tone
  - when `sent` is true, a `<p role="status" class="form-success">` thank-you message
  - `<FormError errors={errors} />`
  - `<form method="post" action="/feedback" class="stacked-form">` with:
    - `Field` "Agent": a `<select {...controlProps('agent', errors.agent)}>` with "Stay anonymous" (`value=""`) first, then every agent, keeping `values.agent` selected
    - `Field` "Message": a `<textarea {...controlProps('message', errors.message)} rows={5} maxlength={1000} required>` showing `values.message`
    - a `<button type="submit">Send feedback</button>`
1.3. Add a view test (in `src/views/views.test.ts`): the thanks only shows when `sent` is true, and error messages render next to their fields.

## 2. Routes

2.1. In `src/app.tsx`, add a `renderFeedback(c, values, errors, status = 200, sent = false)` helper, following `renderBooking`.
2.2. `GET /feedback`: render with `{ agent: c.req.query('agent') ?? '' }`, and `sent` set when `c.req.query('sent') === '1'`.
2.3. `POST /feedback`: `readForm`, then `validateFeedback(values, { agentIds: new Set(listAgents(db).map((a) => a.id)) })`.
  - On failure, `renderFeedback(c, values, result.errors, 400)`.
  - On success, `createFeedback(db, result.value)` and `c.redirect('/feedback?sent=1', 303)`.
2.4. Add tests in `src/app.test.ts` (`describe('GET /feedback')`, `describe('POST /feedback')`):
  - `GET` lists "Stay anonymous" first, then every agent. `?agent=<id>` preselects that agent. `?agent=999` preselects nothing.
  - `GET ?sent=1` shows the `role="status"` thanks. A plain `GET` doesn't.
  - A valid anonymous `POST` and a valid `POST` with an agent each `303` to `/feedback?sent=1` and save one row (check with `listFeedback`) with the trimmed message and the right `agentId`.
  - A blank message, a 1001-character message, and an unknown agent each give `400`, show the field error, keep the typed message, and save nothing.

## 3. Nav link

3.1. In `src/views/Header.tsx`, add `{ href: '/feedback', label: 'Feedback' }` just before Staff.
3.2. In `src/views/Layout.test.tsx`, add `<a href="/feedback">Feedback</a>` to the nav links test. Check that `/feedback` marks its link `aria-current="page"`.

## 4. Shared page checks

4.1. Add to `pages` in `src/pages.test.ts`:
  - `['feedback form', () => app.request('/feedback')]`
  - `['feedback form (sent)', () => app.request('/feedback?sent=1')]`
  - `['feedback form (invalid)', () => post('/feedback', { agent: '999', message: '' })]`
  - `['feedback form (empty clinic)', () => emptyApp.request('/feedback')]`

## 5. Verify and wrap up

5.1. Run `npm run validate` (under Node 24: run `nvm use` first) and fix any failures.
5.2. Go through [validation.md](validation.md), including the manual browser check.
5.3. Mark Phase 14 `✅ Done` in `specs/roadmap.md`, then commit.
