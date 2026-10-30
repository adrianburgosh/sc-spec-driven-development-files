import type { Db } from './index.js'
import { nowKey, upcomingSlots } from '../slots.js'
import type { Appointment } from '../types.js'

const select = `
  SELECT appointments.id, appointments.slot, appointments.status,
         agents.id AS agentId, agents.name AS agentName,
         therapies.id AS therapyId, therapies.name AS therapyName
  FROM appointments
  JOIN agents ON agents.id = appointments.agent_id
  JOIN therapies ON therapies.id = appointments.therapy_id`

/** Booked appointments that start after `now`, soonest first. */
export const listUpcomingAppointments = (db: Db, now: Date): Appointment[] =>
  db
    .prepare(`${select} WHERE appointments.status = 'booked' AND appointments.slot > ? ORDER BY appointments.slot`)
    .all(nowKey(now)) as Appointment[]

export const getAppointment = (db: Db, id: number): Appointment | undefined =>
  db.prepare(`${select} WHERE appointments.id = ?`).get(id) as Appointment | undefined

/** Upcoming slots that nobody has booked yet. */
export const listFreeSlots = (db: Db, now: Date): string[] => {
  const booked = new Set(
    (db.prepare("SELECT slot FROM appointments WHERE status = 'booked' AND slot > ?").all(nowKey(now)) as { slot: string }[]).map(
      (row) => row.slot,
    ),
  )
  return upcomingSlots(now).filter((slot) => !booked.has(slot))
}

/** Cancels a booked appointment that hasn't started yet. Returns false if there was nothing to cancel. */
export const cancelAppointment = (db: Db, id: number, now: Date): boolean =>
  db
    .prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ? AND status = 'booked' AND slot > ?")
    .run(id, nowKey(now)).changes > 0

export class SlotTakenError extends Error {
  constructor(slot: string) {
    super(`Slot ${slot} is already booked`)
    this.name = 'SlotTakenError'
  }
}

/** Books a slot and returns the new appointment's id. The unique index decides if the slot is free. */
export const createAppointment = (
  db: Db,
  { agentId, therapyId, slot }: { agentId: number; therapyId: number; slot: string },
): number => {
  try {
    return Number(
      db
        .prepare('INSERT INTO appointments (agent_id, therapy_id, slot) VALUES (?, ?, ?)')
        .run(agentId, therapyId, slot).lastInsertRowid,
    )
  } catch (err) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed: appointments.slot')) {
      throw new SlotTakenError(slot)
    }
    throw err
  }
}
