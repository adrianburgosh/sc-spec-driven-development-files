# MVP (Phases 3–12): Plan

Work on the `mvp` branch. Finish each phase with `npm run validate` (exit 0), a quick manual check at 360/768/1280px for any UI change, and a commit before starting the next.

## Phase 3: Agent ailments

3.1. In `schema.sql`, add `agent_ailments` (`agent_id`, `ailment_id`, `PRIMARY KEY (agent_id, ailment_id)`, both `REFERENCES … ON DELETE CASCADE`).
3.2. In `src/db/ailments.ts`, add `listAilmentsForAgent(db, agentId)`, sorted by name.
3.3. In `seed.ts`, wipe and insert the links (each agent gets 1–3 ailments, by name), clearing the join tables before their parent tables.
3.4. `AgentPage` takes `ailments: Ailment[]` and renders a "Current ailments" list with severity badges, or an empty state. Pull the badge into a shared `SeverityBadge` view.
3.5. Tests: the migration creates `agent_ailments`; the links survive a re-seed without duplicating; `listAilmentsForAgent` is sorted, and it's empty for an agent with no links; `GET /agents/:id` shows that agent's ailments and not others'.
3.6. Run `npm run validate`, then commit.

## Phase 4: Therapies

4.1. In `schema.sql`, add `therapies` (`duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0)`).
4.2. Add the `Therapy` type to `src/types.ts`. Create `src/db/therapies.ts` with `listTherapies(db)` and `getTherapy(db, id)`.
4.3. Seed about 6 therapies with playful copy.
4.4. `TherapiesPage`: `<article id="therapy-<id>">` cards (name, description, "45 min") in `.card-grid`, with an empty state.
4.5. Route `GET /therapies`. Add **Therapies** to the `Header` links.
4.6. Tests: the table and its `CHECK`; seed counts; the list is sorted; the route lists every seeded therapy; the empty state; the nav link and `aria-current`.
4.7. Run `npm run validate`, then commit.

## Phase 5: Therapies for ailments

5.1. In `schema.sql`, add `ailment_therapies` (composite primary key, cascading foreign keys).
5.2. In `src/db/therapies.ts`, add `listTherapiesForAilment(db, ailmentId)` and a bulk `listTherapiesByAilment(db)` that returns a `Map<ailmentId, Therapy[]>` (one query, no N+1).
5.3. Seed the links so that every ailment has at least one therapy.
5.4. On each `AilmentsPage` card, show "Recommended therapies" with links to `/therapies#therapy-<id>`, or "No therapy yet".
5.5. Tests: the links survive a re-seed; the bulk map matches the single-ailment lookup; `/ailments` shows the right therapies under the right ailment.
5.6. Run `npm run validate`, then commit.

## Phase 6: Appointments list

6.1. In `schema.sql`, add `appointments` (`agent_id`, `therapy_id` with foreign keys, `slot TEXT NOT NULL`, `status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','cancelled'))`, `created_at`). Add `CREATE UNIQUE INDEX IF NOT EXISTS appointments_booked_slot ON appointments(slot) WHERE status = 'booked'`.
6.2. Create `src/slots.ts`, with pure functions:
  - `toSlot(date)` turns a date into `YYYY-MM-DDTHH:00` in local time
  - `upcomingSlots(now, days = 14)` lists weekday slots from 09:00 to 16:00 that are after `now`
  - `isValidSlot(slot)`
  - `formatSlot(slot)` returns a friendly date and time
6.3. Change `createApp(db, { now } = {})`, where `now` defaults to `() => new Date()`. Update `index.ts` and the tests' helper.
6.4. Add the `Appointment`/`AppointmentView` types and `src/db/appointments.ts`:
  - `listUpcomingAppointments(db, now)` joins in the agent and therapy names and sorts by slot
  - `getAppointment(db, id)`
6.5. Seed 3–4 booked appointments on upcoming slots, computed from the date of the seed run.
6.6. `AppointmentsPage`: a list (or cards) with the formatted slot, a linked agent, and the therapy, plus an empty state. Route `GET /appointments`, and add **Appointments** to the nav.
6.7. Tests:
  - `slots.test.ts`: weekends are skipped, the hours are right, slots before `now` are excluded, and the 14-day horizon holds
  - the unique index rejects a second booked appointment in the same slot but allows one that is cancelled
  - the list only contains booked future appointments, in order
  - the route works with a fixed `now`, and shows the empty state
6.8. Run `npm run validate`, then commit.

## Phase 7: Book an appointment

7.1. Create `src/validation.ts` with `validateBooking(input, { agentIds, therapyIds, freeSlots })`, which returns `{ ok: true, value } | { ok: false, errors }`.
7.2. In `src/db/appointments.ts`, add:
  - `bookedSlots(db, fromSlot)`
  - `createAppointment(db, { agentId, therapyId, slot })`, which throws a typed `SlotTakenError` when it hits the unique constraint
7.3. `BookingPage` view: a form with labelled `<select>`s (agent, therapy, free slots grouped by day with `<optgroup>`), the kept values, per-field errors (`aria-invalid` and `aria-describedby`), and a top-level error.
7.4. Routes:
  - `GET /appointments/new` (`?agent=` preselects the agent)
  - `POST /appointments` (`c.req.parseBody()`) validates, creates the appointment, then `303` to `/appointments?booked=<id>`. A validation error returns `400`, and a slot that's taken returns `409`.
7.5. `AppointmentsPage` gets a "Book an appointment" link and highlights the `booked` row.
7.6. Tests:
  - the validation unit tests cover each error
  - `GET /appointments/new` lists only free future slots and preselects the agent
  - a valid POST returns `303`, and the appointment exists
  - a missing or unknown agent or therapy returns `400`
  - a past or malformed slot returns `400`
  - a taken slot returns `409`, and no row is added
  - the re-rendered form keeps the submitted values
7.7. Run `npm run validate`, then commit.

## Phase 8: Cancel an appointment

8.1. In `src/db/appointments.ts`, add `cancelAppointment(db, id, now)`. It returns `false` if the appointment is unknown, already cancelled or past.
8.2. Route `POST /appointments/:id/cancel`: `303` to `/appointments`, or `404` with an `AppointmentNotFoundPage`.
8.3. Add a Cancel form button to each row on `AppointmentsPage` (`aria-label="Cancel <therapy> for <agent> on <slot>"`).
8.4. Tests:
  - a cancel returns `303`, and the appointment disappears from the list
  - an unknown or non-numeric id, a second cancel, or a past appointment returns `404`
  - the cancelled slot is offered again on `/appointments/new` and can be booked
8.5. Run `npm run validate`, then commit.

## Phase 9: Agent dashboard

9.1. Add the data:
  - `listSuggestedTherapiesForAgent(db, agentId)`: distinct therapies across the agent's ailments, sorted by name
  - `listUpcomingAppointmentsForAgent(db, agentId, now)`
9.2. `AgentDashboardPage`: three sections, each with its own empty state, a "Book an appointment" link (`/appointments/new?agent=<id>`), and Cancel buttons on the appointments. Pull the appointment row and the cancel button into a shared view.
9.3. Route `GET /agents/:id/dashboard`, which returns the agent 404 when the id is unknown or non-numeric. `AgentPage` links to the dashboard.
9.4. Cancelling from the dashboard brings you back to the dashboard: the cancel form sends a `redirect` field, which is allowed only if it's a local path starting with `/agents/` or `/appointments`.
9.5. Tests:
  - the suggested therapies are distinct
  - the dashboard shows only this agent's ailments, therapies and appointments
  - each section's empty state appears
  - the dashboard 404s for an unknown id
  - the cancel redirect goes back to the dashboard, and an off-site `redirect` is ignored
9.6. Run `npm run validate`, then commit.

## Phase 10: Staff dashboard

10.1. Add the data: `clinicCounts(db, now)` and `listAppointmentsOn(db, day)` (only booked appointments, sorted by time).
10.2. `StaffDashboardPage`: count tiles (a responsive grid), "Today's appointments" with an empty state, and links to the management sections.
10.3. Route `GET /staff`, plus **Staff** in the nav.
10.4. Tests: the counts match the seed and a fixed `now`; "today" uses the injected clock and excludes cancelled appointments and other days; the empty state; the nav link.
10.5. Run `npm run validate`, then commit.

## Phase 11: Staff management

11.1. Add the write functions:
  - `createAgent`/`updateAgent`, `createAilment`/`updateAilment`, `createTherapy`/`updateTherapy`
  - `setAilmentLinks(db, ailmentId, { agentIds, therapyIds })`, which replaces the links inside a transaction
11.2. In `src/validation.ts`, add `validateAgent`, `validateAilment` and `validateTherapy` (trimmed required fields, the date, severity, duration 5–240, ids that exist).
11.3. Views: `AgentForm`, `AilmentForm` (with agent and therapy checkbox `<fieldset>`s) and `TherapyForm`, shared by new and edit, with a reusable `Field` component for the label, input and error.
11.4. Routes, for each entity in `agents`, `ailments` and `therapies`:
  - `GET /staff/<entity>/new` and `POST /staff/<entity>`
  - `GET /staff/<entity>/:id/edit` and `POST /staff/<entity>/:id`
  - success returns `303` to the public page (`/agents/:id`, `/ailments`, `/therapies`), invalid input returns `400`, and an unknown id returns `404`
11.5. The staff dashboard lists each entity with an Edit link, and each section has an Add link.
11.6. Tests:
  - the validator unit tests
  - create and update round-trip through the database for each entity
  - `400` re-renders keep the values and show the errors
  - an unknown id returns `404` on both the GET and the POST
  - ailment link edits replace the old links (no leftovers or duplicates)
11.7. Run `npm run validate`, then commit.

## Phase 12: Polish

12.1. Add a catch-all `app.notFound`, which renders `NotFoundPage` in the layout with `404`, and an `app.onError`, which renders `ErrorPage` with `500`, logs to the server, and keeps the stack out of the page.
12.2. Audit every page: one `<h1>`, heading order, labels, the error wiring, the focus ring, and AA contrast for the new badge, highlight and error colors (record the ratios in `styles.css` comments).
12.3. Make sure every list page has a friendly empty state. Unify the empty-state markup into an `EmptyState` view.
12.4. Tests:
  - an unknown path returns `404` in the layout
  - a forced error returns `500` without a stack trace
  - every page renders exactly one `<h1>`
  - every form control has a matching `<label for>`
12.5. Do the cross-device review: every page at 360/768/1280px, and keyboard-only booking and cancelling. Fix anything you find.
12.6. Run `npm run validate`, then commit.

## Wrap-up

W.1. Run through all of `validation.md`.
W.2. Mark Phases 3–12 done in `specs/roadmap.md` if that's the convention, update `CHANGELOG.md`, and commit.
W.3. Open a PR from `mvp` to `main`.
