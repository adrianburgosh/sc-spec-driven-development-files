# MVP (Phases 3–12): Requirements

## Context

Phases 1–2 shipped the layout, Pico theme, SQLite with a startup migration, the seed script, and the `/agents`, `/agents/:id` and `/ailments` pages. The MVP is everything left on `specs/roadmap.md`: Phases 3–12. When it's done, AgentClinic delivers the whole mission. Agents can find their ailments and the therapies that treat them, then book and cancel appointments from their own dashboard. Staff run the clinic from a dashboard with forms to manage agents, ailments and therapies.

All of it is built on the `mvp` branch, one roadmap phase at a time. Each phase is validated (`npm run validate`) and committed before the next one starts, and the branch merges to `main` once the whole of `validation.md` passes.

Guidance: `specs/mission.md` (agent-first, playful and warm tone, any screen, reliability, no real healthcare or billing) and `specs/tech-stack.md` (Hono JSX, Pico CSS, `node:sqlite` through a thin typed data-access layer, Vitest, mobile-first, no required client JS). It follows the conventions of `specs/2026-10-29-database-agents-ailments/`.

## Scope

### Phase 3: Agent ailments
- An `agent_ailments` join table (`agent_id`, `ailment_id`, composite primary key, foreign keys with `ON DELETE CASCADE`).
- The seed links each agent to 1–3 ailments.
- `/agents/:id` lists the agent's ailments (name and severity badge), sorted by name. If the agent has none, it shows a friendly empty state.

### Phase 4: Therapies
- A `therapies` table: `id`, `name`, `description` (playful), `duration_minutes` (a positive integer, enforced by `CHECK`).
- The seed adds about 6 therapies (e.g. "Context Window Detox", "Temperature Reduction Session").
- `/therapies` lists every therapy (name, description, duration) as `<article>` cards in `.card-grid`, sorted by name, with an empty state.
- The nav gains a **Therapies** link.

### Phase 5: Therapies for ailments
- An `ailment_therapies` join table (`ailment_id`, `therapy_id`, composite primary key, cascading foreign keys).
- The seed links every ailment to at least one therapy.
- Each ailment card on `/ailments` shows a "Recommended therapies" list linking to `/therapies#therapy-<id>`, or "No therapy yet". Every therapy card has a matching `id` anchor.

### Phase 6: Appointments list
- An `appointments` table: `id`, `agent_id`, `therapy_id`, `slot` (local clinic time `YYYY-MM-DDTHH:00`), `status` (`booked` | `cancelled`, enforced by `CHECK`), `created_at`.
- A partial unique index on `slot WHERE status = 'booked'`: the database itself refuses a double-booking.
- The seed adds a few upcoming booked appointments, relative to the seed run date.
- `/appointments` lists upcoming booked appointments (slot ≥ now), soonest first, showing the formatted date and time, the agent (linked), and the therapy. It has an empty state.
- The nav gains an **Appointments** link.

### Phase 7: Book an appointment
- `GET /appointments/new` shows a form with three `<select>`s: the agent, the therapy, and a time slot that lists only free future slots. `?agent=<id>` preselects the agent.
- `POST /appointments` validates the input. The agent and therapy must exist. The slot must be a valid slot, in the future, and free.
  - Valid: the appointment is created, then `303` redirect to `/appointments`, where the new appointment is highlighted (via `?booked=<id>`).
  - Invalid: status `400`, and the form is re-rendered with the submitted values kept and a friendly error message per field.
  - Double-booking (including a race caught by the unique index): status `409`, with a friendly "that slot was just taken" error on the re-rendered form.
- `/appointments` gets a **Book an appointment** link.

### Phase 8: Cancel an appointment
- Each upcoming appointment on `/appointments` has a **Cancel** button: a small `<form method="post" action="/appointments/:id/cancel">`, with no JS.
- `POST /appointments/:id/cancel` sets `status = 'cancelled'`, then `303` redirect to `/appointments`. An unknown, non-numeric, already-cancelled or past appointment returns `404` with a friendly page.
- A cancelled slot can be booked again.

### Phase 9: Agent dashboard
- `/agents/:id/dashboard` shows three sections:
  - "My ailments"
  - "Suggested therapies": the distinct therapies that treat any of the agent's ailments, sorted by name
  - "My upcoming appointments", each with a Cancel button
- It has a "Book an appointment" link that preselects the agent. Each section has its own empty state.
- `/agents/:id` links to the dashboard. An unknown id returns the friendly agent 404.

### Phase 10: Staff dashboard
- `/staff` shows:
  - today's booked appointments, by time
  - counts at a glance: agents, ailments, therapies, upcoming appointments
  - links to the staff management pages
- The nav gains a **Staff** link.

### Phase 11: Staff management
- Add and edit forms for agents, ailments and therapies:
  - `/staff/agents/new`, `/staff/agents/:id/edit`, with the same pattern for `ailments` and `therapies`
  - Each form submits via `POST` to `/staff/<entity>` (create) or `/staff/<entity>/:id` (update)
- Validation: required fields aren't blank (after trimming); an agent's `checked_in_on` is a valid date; severity is one of the three values; duration is a whole number from 5 to 240.
  - Valid: `303` redirect to the entity's public page.
  - Invalid: `400`, and the form is re-rendered with the submitted values and the errors.
- The ailment form edits which agents have it and which therapies treat it, as checkbox lists. Unknown ids return `404`.
- The staff dashboard lists each entity with an Edit link, and each section has an Add link.

### Phase 12: Polish
- Every page has a friendly empty state and stays in the layout. There's also a catch-all `404` page ("this room doesn't exist") and a `500` error handler page that never leaks stack traces.
- Accessibility:
  - one `<h1>` per page and logical heading order
  - every form control has a `<label>`
  - errors are tied to their fields (`aria-invalid`, `aria-describedby`)
  - the focus ring stays visible
  - WCAG AA contrast for any new colors (badges, highlights, error text)
  - everything works by keyboard alone
- A cross-device review of every page at 360/768/1280px.

### Throughout
- Responsive from 320px up with no horizontal scrolling. Forms and lists are a single column on phones.
- Playful copy in seed data, empty states and errors. It's never mean, and it never makes real medical claims.
- No client-side JavaScript is required: every action is a plain HTML form.

## Out of scope

- Authentication, sessions, roles or passwords: anyone can open the staff pages.
- Deleting agents, ailments or therapies (only add and edit). Deleting appointments: cancellation is a status change.
- Rescheduling (cancel and rebook instead), recurring appointments, multiple clinicians or rooms.
- Email or notifications, payments, insurance, billing (mission non-goals).
- Dark mode, a JSON API, i18n, time zones other than the server's local time.
- Pagination and search.

## Decisions

- **The whole roadmap is the MVP:** all of Phases 3–12, so the MVP meets every stakeholder need in `mission.md`. That includes the dashboards for agents and staff (Mary), the booking flow (Susan), and a polished site (Steve).
- **No auth, so the agent is picked in the UI:** the booking form has an agent dropdown, and each agent's dashboard is at `/agents/:id/dashboard`. Staff pages are open. This keeps the MVP free of sessions and new dependencies. Auth can be a post-MVP phase.
- **Fixed hourly slots, one at a time clinic-wide:** slots run every hour from 09:00 to 16:00 (the last one ends at 17:00), Monday to Friday, for the next 14 days. Only one booked appointment per slot, whatever the therapy. Past slots can't be booked. Slot generation is a pure function (`src/slots.ts`), so it's easy to test.
- **An injectable clock:** `createApp(db, { now })` takes an optional `now: () => Date` (default `() => new Date()`), so tests that depend on "upcoming", "today" and "future slot" are deterministic.
- **The database enforces double-booking:** the app checks first to give a friendly error. The partial unique index is the real guarantee, and a constraint error maps to `409`.
- **Cancel is a status, not a delete:** this keeps history and frees the slot, because the unique index only covers `booked`.
- **Forms are plain HTML with Post/Redirect/Get:** they `POST` and `303` redirect on success, or re-render with `400`/`409` on error, so refreshing never resubmits. Cancel uses `POST` because HTML forms can't send `DELETE`.
- **Validation lives in pure functions** (`src/validation.ts`) that return `{ ok, value } | { ok: false, errors }`. Routes call them, and views only render errors.
- **The existing architecture stays:** data access in `src/db/<entity>.ts` with prepared statements, domain types in `src/types.ts`, and pure views that never import from `src/db/`. New tables are appended to the idempotent `schema.sql` (`IF NOT EXISTS` everywhere).
- **Committed phase by phase:** one spec directory covers the MVP. Each phase ends with `npm run validate` and a commit (or a few) on `mvp`, and the changelog is updated at the end.
