import type { Db } from './index.js'
import { nowKey } from '../slots.js'
import type { ClinicCounts } from '../types.js'

export const clinicCounts = (db: Db, now: Date): ClinicCounts =>
  db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM agents) AS agents,
         (SELECT COUNT(*) FROM ailments) AS ailments,
         (SELECT COUNT(*) FROM therapies) AS therapies,
         (SELECT COUNT(*) FROM appointments WHERE status = 'booked' AND slot > ?) AS upcomingAppointments`,
    )
    .get(nowKey(now)) as ClinicCounts
