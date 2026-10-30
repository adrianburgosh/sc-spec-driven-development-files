import type { Db } from './index.js'
import type { Therapy } from '../types.js'

const columns =
  'therapies.id, therapies.name, therapies.description, therapies.duration_minutes AS durationMinutes'

export const listTherapies = (db: Db): Therapy[] =>
  db.prepare(`SELECT ${columns} FROM therapies ORDER BY name`).all() as Therapy[]

export const getTherapy = (db: Db, id: number): Therapy | undefined =>
  db.prepare(`SELECT ${columns} FROM therapies WHERE id = ?`).get(id) as Therapy | undefined
