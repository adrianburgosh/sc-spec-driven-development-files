import type { Db } from './index.js'
import { nowKey } from '../slots.js'
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
