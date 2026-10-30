// Pure form validation. Routes call these with the raw form values; views only render the errors.
import { isValidSlot, nowKey, upcomingSlots } from './slots.js'

/** Error messages keyed by field name. `form` is for errors that aren't about one field. */
export type FormErrors = Partial<Record<string, string>>

export type Validated<T> = { ok: true; value: T } | { ok: false; errors: FormErrors }

/** Raw form values, as submitted. */
export type FormValues = Record<string, string>

const toId = (raw: string | undefined) => (raw && /^\d+$/.test(raw.trim()) ? Number(raw.trim()) : undefined)

const result = <T>(errors: FormErrors, value: () => T): Validated<T> =>
  Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value: value() }

export type BookingInput = {
  agentId: number
  therapyId: number
  slot: string
}

type BookingContext = {
  agentIds: Set<number>
  therapyIds: Set<number>
  now: Date
}

/**
 * Checks that the agent and therapy exist and the slot is a bookable future slot.
 * Whether the slot is still free is left to the database (see createAppointment).
 */
export const validateBooking = (input: FormValues, { agentIds, therapyIds, now }: BookingContext): Validated<BookingInput> => {
  const errors: FormErrors = {}
  const agentId = toId(input.agent)
  const therapyId = toId(input.therapy)
  const slot = (input.slot ?? '').trim()

  if (!input.agent?.trim()) errors.agent = 'Choose which agent is booking.'
  else if (agentId === undefined || !agentIds.has(agentId)) errors.agent = "We couldn't find that agent on our books."

  if (!input.therapy?.trim()) errors.therapy = 'Choose a therapy.'
  else if (therapyId === undefined || !therapyIds.has(therapyId)) errors.therapy = "We don't offer that therapy (yet)."

  if (!slot) errors.slot = 'Pick a time slot.'
  else if (!isValidSlot(slot)) errors.slot = "That's not one of our opening hours (weekdays, 09:00–16:00, on the hour)."
  else if (slot <= nowKey(now)) errors.slot = 'That time has already passed. Even we cannot go back in time.'
  else if (!upcomingSlots(now).includes(slot)) errors.slot = 'We only take bookings up to two weeks ahead.'

  return result(errors, () => ({ agentId: agentId!, therapyId: therapyId!, slot }))
}
