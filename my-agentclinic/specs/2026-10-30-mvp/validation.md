# MVP (Phases 3–12): Validation

The `mvp` branch is ready to merge into `main` when every check below passes. Each phase must also pass `npm run validate` before its commit.

Leave the checkboxes unticked: report the results instead of marking them, and don't ask whether to tick them.

## Automated (Vitest)

- [ ] `npm run validate` exits 0. It runs `tsc --noEmit`, the full Vitest suite, and the production build. Tests that depend on time use a fixed `now` passed to `createApp(db, { now })`. The suite backs every check below:
  - **Schema and data** (`src/db/db.test.ts`):
    - the migration creates `agent_ailments`, `therapies`, `ailment_therapies` and `appointments`, and running it twice doesn't throw
    - the `CHECK` constraints reject a non-positive `duration_minutes` and an unknown appointment `status`
    - the unique index rejects two `booked` appointments in the same slot, but allows a booked one next to a cancelled one in that slot
    - deleting an agent cascades its `agent_ailments` rows
    - `seed` is idempotent (running it twice doesn't change the counts), and every ailment has at least one therapy
    - every list function returns rows sorted as specified, and suggested therapies are distinct
  - **Slots** (`src/slots.test.ts`):
    - only weekdays, from 09:00 to 16:00, on the hour
    - nothing at or before `now`, and nothing past 14 days
    - `isValidSlot` rejects off-hour, weekend and malformed values
  - **Validation** (`src/validation.test.ts`): each booking, agent, ailment and therapy rule produces its specific error, and valid input passes with trimmed values.
  - **Routes** (`src/app.test.ts`):
    - Phase 2 checks still pass
    - `/agents/:id` shows only that agent's ailments, and the empty state when it has none
    - `/therapies` lists every therapy with its duration and `id="therapy-<id>"` anchors
    - `/ailments` shows each ailment's recommended therapies
    - `/appointments` lists only booked future appointments, soonest first, and shows the empty state when there are none
    - `GET /appointments/new`: only free future slots are offered, and `?agent=` preselects the agent
    - `POST /appointments` returns:
      - `303` for valid input, and the row exists
      - `400` for a missing, unknown or past value, with the values kept
      - `409` for a taken slot, and no row is added
    - `POST /appointments/:id/cancel` returns:
      - `303` for a valid cancel; afterwards the appointment is gone from the list and its slot is free again
      - `404` for an unknown, non-numeric, already-cancelled or past appointment
    - `/agents/:id/dashboard` shows only that agent's ailments, suggested therapies and upcoming appointments, with an empty state per section, and returns `404` for an unknown id. The cancel redirect goes back to the dashboard and ignores an off-site `redirect`.
    - `/staff` counts match the data, and "today" follows the injected clock and excludes cancelled appointments
    - staff add and edit for agents, ailments and therapies return `303` and persist; invalid input returns `400` with the values kept; an unknown id returns `404`; ailment links are replaced, not duplicated
    - an unknown path returns a `404` page in the layout, and a thrown error returns `500` with no stack trace in the body
  - **Layout and views** (`src/views/*.test.tsx`):
    - the nav contains Home, Agents, Ailments, Therapies, Appointments and Staff, and only the current link has `aria-current`
    - every page has exactly one `<h1>`
    - every form control has a matching `<label>`, and invalid fields carry `aria-invalid` and `aria-describedby`

## Manual smoke check

- [ ] `npm run seed`, then `npm run dev`, and walk the agent journey: open an agent, their dashboard, the suggested therapies, then book an appointment. It appears on `/appointments`, the agent's dashboard and (if it's for today) `/staff`. Cancel it from the dashboard, and the slot can be booked again.
- [ ] Try to double-book the same slot in two browser tabs: the second submission shows the friendly "slot taken" error.
- [ ] Staff journey: add an agent, edit an ailment's links to agents and therapies, and edit a therapy's duration. Each change shows on the public pages.
- [ ] Restart the server: the data persists and the migration doesn't error on an existing Phase 2 database.
- [ ] Disable JavaScript in the browser: booking, cancelling and every staff form still work.
- [ ] Keyboard-only: reach and complete a booking and a cancel using only Tab, Shift+Tab, Enter and Space, with a visible focus ring all the way.
- [ ] Responsive check at 360px, 768px and 1280px on every page (home, agents, agent profile, agent dashboard, ailments, therapies, appointments, booking form, staff dashboard, every staff form, and the 404 page): no horizontal scrolling, forms and lists are a single column on phones, and text and tap targets stay readable.
- [ ] Copy review: the seed data, empty states and errors are playful and warm, never mean, and make no real medical claims.

## Scope guard (review)

- [ ] No authentication, deletion of agents, ailments or therapies, rescheduling, notifications, payments, dark mode, JSON API or required client-side JavaScript was added.
- [ ] Views receive plain data and never import from `src/db/`. Validation lives in `src/validation.ts`, and slot logic lives in `src/slots.ts`.
- [ ] Every schema statement is idempotent (`IF NOT EXISTS`), and no database file is committed.
- [ ] Every new color meets WCAG AA contrast, with the ratios noted in `styles.css`.
- [ ] The commit history on `mvp` shows each roadmap phase (3–12) validated and committed in order, and `CHANGELOG.md` is updated.
