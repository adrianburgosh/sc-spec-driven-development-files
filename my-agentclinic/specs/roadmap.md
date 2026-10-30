# Roadmap

Nano phases: each phase is a very small slice of 1–3 features, shippable in a day or less. Finish, validate (`npm run validate`), and commit each phase before starting the next.

Every phase that adds or changes UI builds it responsive from the start (mobile-first, see `tech-stack.md`), so there is no separate "make it responsive" phase.

## Phase 1 — Hello, clinic
- Install Hono and serve a home page with a "Welcome to AgentClinic" message.
- Add `dev` and `test` npm scripts, plus one Vitest route test.

## Phase 2 — Layout, database, agents & ailments
- Shared JSX layout (header, nav, footer).
- Base mobile-first stylesheet with the clinic's colors and typography.
- Add SQLite with a schema file and startup migration.
- Seed script with a few sample agents.
- `/agents` page listing all agents.
- `/agents/:id` page showing one agent's profile.
- Ailments table and seed data.
- `/ailments` page listing ailments.

## Phase 3 — Agent ailments
- Link agents to ailments.
- Show an agent's ailments on their detail page.

## Phase 4 — Therapies
- Therapies table and seed data.
- `/therapies` page listing therapies.

## Phase 5 — Therapies for ailments
- Link therapies to the ailments they treat.
- Show recommended therapies on each ailment.

## Phase 6 — Appointments list
- Appointments table (agent, therapy, time slot).
- `/appointments` page listing upcoming appointments.

## Phase 7 — Book an appointment
- Booking form (agent, therapy, time slot).
- Validate input and prevent double-booking a slot.

## Phase 8 — Cancel an appointment
- Cancel action for an existing appointment.

## Phase 9 — Agent dashboard
- Agent dashboard: my ailments, suggested therapies, my upcoming appointments.

## Phase 10 — Staff dashboard
- Staff dashboard: today's appointments and clinic counts at a glance.

## Phase 11 — Staff management
- Staff forms to add/edit agents, ailments, and therapies.

## Phase 12 — Polish
- Cross-device review of all pages (phone, tablet, desktop) and friendly empty/error states.
- Accessibility pass (semantic HTML, contrast, keyboard navigation).
