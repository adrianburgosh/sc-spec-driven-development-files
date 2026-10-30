# Roadmap

Very small phases, built in order. Each phase ends with something visible in the browser, tests for it, and a passing `npm run validate`.

Phases 13 and later follow `TODO.md`: **Now** is the feedback form. **Next** is customer reviews and the About us page.

## Done: MVP (Phases 1–12)

1. **Hello, clinic.** Hono server, layout and home page.
2. **Agents and ailments.** SQLite, seed data, `/agents`, `/agents/:id`, `/ailments`, Pico theme and nav.
3. Link agents to ailments on the agent profile.
4. Therapies and the `/therapies` page.
5. Recommend therapies for each ailment.
6. Hourly weekday appointment slots and `/appointments`.
7. Booking form with validation and double-booking protection.
8. Cancel upcoming appointments.
9. Agent dashboard: ailments, suggested therapies and upcoming appointments.
10. Staff dashboard at `/staff`: today's appointments and clinic counts.
11. Staff forms to add and edit agents, ailments and therapies.
12. Polish: 404 and 500 pages, empty states, accessibility checks on every page.

## Now: Feedback form

### Phase 13: Store feedback ✅ Done
- Add a `feedback` table: optional agent, message (required, length-limited), created time.
- Add typed data access to create and list feedback, newest first.
- Tests: save and list, reject an empty message.

### Phase 14: Feedback form
- `GET /feedback` and `POST /feedback`: choose an agent (optional) and write a message.
- Server-side validation with field errors. On success, redirect to a thank-you message.
- Add a "Feedback" link to the nav and add the page to the shared page checks.

### Phase 15: Staff read feedback
- `/staff/feedback` lists feedback, newest first, with an empty state.
- The staff dashboard shows a count of feedback from the last 7 days and links to the list.

## Next: Customer reviews

### Phase 16: Store reviews
- Add a `reviews` table: agent, therapy, rating 1–5 (`CHECK`), text, status `pending` / `approved` / `rejected` (default `pending`), created time.
- Typed data access to create a review, list approved reviews for a therapy, and list pending ones.

### Phase 17: Agents write a review
- From the agent dashboard, an agent can review a therapy they've had (a past booked appointment).
- New reviews are `pending`. The agent sees "Thanks, your review is waiting for approval."

### Phase 18: Staff approve reviews
- `/staff/reviews` lists pending reviews with **Approve** and **Reject** buttons.
- The staff dashboard shows the number of pending reviews.

### Phase 19: Show reviews
- `/therapies` shows each therapy's average rating and number of approved reviews.
- Each therapy shows its latest approved reviews. Pending and rejected reviews never appear.

## Next: About us

### Phase 20: About us page
- `/about`: who we are (from the mission), the clinic address, and opening hours taken from the slot rules (weekdays 09:00–17:00).
- Link it in the nav or footer and add it to the shared page checks.

### Phase 21: Map
- Embed an OpenStreetMap `<iframe>` of the clinic address, with a `title` for screen readers.
- Add a plain "View larger map" link below it, so the address can still be found without the iframe.

## Later

- Staff login for `/staff` (the known gap in [tech-stack.md](tech-stack.md)).
- Basic anti-spam for the feedback and review forms.
