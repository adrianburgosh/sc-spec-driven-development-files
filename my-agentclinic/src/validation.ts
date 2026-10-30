// Pure form validation. Routes call these with the raw form values; views only render the errors.
import { isValidSlot, nowKey, upcomingSlots } from './slots.js'
import type { Agent, Ailment, AilmentLinks, Severity, Therapy } from './types.js'

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

/** Trims each named field and records an error for any that end up blank. */
const required = <K extends string>(input: FormValues, errors: FormErrors, messages: Record<K, string>) => {
  const values = {} as Record<K, string>
  for (const [field, message] of Object.entries(messages) as [K, string][]) {
    values[field] = (input[field] ?? '').trim()
    if (!values[field]) errors[field] = message
  }
  return values
}

const isIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  // Invalid for month 13; rolls over (to March) for February 30.
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

export const validateAgent = (input: FormValues): Validated<Omit<Agent, 'id'>> => {
  const errors: FormErrors = {}
  const values = required(input, errors, {
    name: 'Every agent needs a name (even if it is just a version number).',
    model: 'Which model is this agent running on?',
    role: 'What does this agent do all day?',
    bio: 'Tell us a little about this agent.',
    checkedInOn: 'When did this agent check in?',
  })
  if (values.checkedInOn && !isIsoDate(values.checkedInOn)) errors.checkedInOn = 'Use a real date, like 2026-10-30.'
  return result(errors, () => values)
}

export const SEVERITIES: Severity[] = ['mild', 'moderate', 'severe']

type AilmentContext = {
  agentIds: Set<number>
  therapyIds: Set<number>
}

/** The checked boxes of a multi-value field, as submitted. */
export type FormLists = Record<string, string[]>

const toIds = (raw: string[] | undefined, known: Set<number>) => {
  const ids = (raw ?? []).map(toId)
  return ids.every((id) => id !== undefined && known.has(id)) ? [...new Set(ids as number[])].sort((a, b) => a - b) : undefined
}

export const validateAilment = (
  input: FormValues,
  lists: FormLists,
  { agentIds, therapyIds }: AilmentContext,
): Validated<Omit<Ailment, 'id'> & AilmentLinks> => {
  const errors: FormErrors = {}
  const values = required(input, errors, {
    name: 'Every ailment needs a name. "That thing" does not count.',
    description: 'Describe the symptoms, gently.',
  })
  const severity = (input.severity ?? '').trim() as Severity
  if (!SEVERITIES.includes(severity)) errors.severity = 'Choose mild, moderate or severe.'
  const agents = toIds(lists.agents, agentIds)
  if (!agents) errors.agents = 'One of those agents has left the clinic. Please check the list again.'
  const therapies = toIds(lists.therapies, therapyIds)
  if (!therapies) errors.therapies = 'One of those therapies no longer exists. Please check the list again.'
  return result(errors, () => ({ ...values, severity, agentIds: agents!, therapyIds: therapies! }))
}

export const MIN_DURATION = 5
export const MAX_DURATION = 240

export const validateTherapy = (input: FormValues): Validated<Omit<Therapy, 'id'>> => {
  const errors: FormErrors = {}
  const values = required(input, errors, {
    name: 'Every therapy needs a name.',
    description: 'Describe what happens in this therapy.',
  })
  const rawDuration = (input.durationMinutes ?? '').trim()
  const durationMinutes = Number(rawDuration)
  if (!rawDuration) errors.durationMinutes = 'How long does a session last?'
  else if (!/^\d+$/.test(rawDuration) || durationMinutes < MIN_DURATION || durationMinutes > MAX_DURATION) {
    errors.durationMinutes = `Use whole minutes, from ${MIN_DURATION} to ${MAX_DURATION}.`
  }
  return result(errors, () => ({ ...values, durationMinutes }))
}
