import type { Db } from './index.js'
import type { Therapy } from '../types.js'

const columns =
  'therapies.id, therapies.name, therapies.description, therapies.duration_minutes AS durationMinutes'

export const listTherapies = (db: Db): Therapy[] =>
  db.prepare(`SELECT ${columns} FROM therapies ORDER BY name`).all() as Therapy[]

export const getTherapy = (db: Db, id: number): Therapy | undefined =>
  db.prepare(`SELECT ${columns} FROM therapies WHERE id = ?`).get(id) as Therapy | undefined

export const listTherapiesForAilment = (db: Db, ailmentId: number): Therapy[] =>
  db
    .prepare(
      `SELECT ${columns} FROM therapies
       JOIN ailment_therapies ON ailment_therapies.therapy_id = therapies.id
       WHERE ailment_therapies.ailment_id = ?
       ORDER BY therapies.name`,
    )
    .all(ailmentId) as Therapy[]

// Every ailment's therapies in one query. Ailments without therapies are absent from the map.
export const listTherapiesByAilment = (db: Db): Map<number, Therapy[]> => {
  const rows = db
    .prepare(
      `SELECT ailment_therapies.ailment_id AS ailmentId, ${columns} FROM therapies
       JOIN ailment_therapies ON ailment_therapies.therapy_id = therapies.id
       ORDER BY therapies.name`,
    )
    .all() as (Therapy & { ailmentId: number })[]
  const byAilment = new Map<number, Therapy[]>()
  for (const { ailmentId, ...therapy } of rows) {
    byAilment.set(ailmentId, [...(byAilment.get(ailmentId) ?? []), therapy])
  }
  return byAilment
}
