// Appointment slots: on the hour, 09:00–16:00 (the last one ends at 17:00), Monday to Friday,
// bookable for the next BOOKING_DAYS days. Slots are strings in the server's local time,
// `YYYY-MM-DDTHH:00`, so they sort and compare as plain text.

export const FIRST_HOUR = 9
export const LAST_HOUR = 16
export const BOOKING_DAYS = 14

const pad = (n: number) => String(n).padStart(2, '0')

const isWeekday = (date: Date) => date.getDay() !== 0 && date.getDay() !== 6

/** The local calendar day, `YYYY-MM-DD`. */
export const toDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** The slot that `date` falls in (its hour, rounded down). */
export const toSlot = (date: Date) => `${toDay(date)}T${pad(date.getHours())}:00`

/** `now` in the same format as a slot, to the minute: a slot starts after `now` when `slot > nowKey(now)`. */
export const nowKey = (now: Date) => `${toDay(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}`

const parseSlot = (slot: string): Date | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):00$/.exec(slot)
  if (!match) return undefined
  const [, y, m, d, h] = match.map(Number)
  const date = new Date(y!, m! - 1, d!, h!)
  // Rejects dates that roll over, like 2026-02-30.
  return toSlot(date) === slot ? date : undefined
}

/** A well-formed slot on a weekday within opening hours (past or future). */
export const isValidSlot = (slot: string) => {
  const date = parseSlot(slot)
  return date !== undefined && isWeekday(date) && date.getHours() >= FIRST_HOUR && date.getHours() <= LAST_HOUR
}

/** Every slot that starts after `now`, within the next `days` days (today included). */
export const upcomingSlots = (now: Date, days = BOOKING_DAYS): string[] => {
  const slots: string[] = []
  const after = nowKey(now)
  for (let offset = 0; offset < days; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    if (!isWeekday(day)) continue
    for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour++) {
      const slot = toSlot(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))
      if (slot > after) slots.push(slot)
    }
  }
  return slots
}

/** "Mon, Nov 2", for a slot or a day. */
export const formatDay = (slotOrDay: string) =>
  new Date(`${slotOrDay.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

/** "09:00" */
export const formatTime = (slot: string) => slot.slice(11, 16)

/** "Mon, Nov 2 · 09:00" */
export const formatSlot = (slot: string) => `${formatDay(slot)} · ${formatTime(slot)}`
