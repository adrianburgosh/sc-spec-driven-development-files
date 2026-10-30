import { transaction, type Db } from './index.js'
import type { Ailment, AilmentLinks } from '../types.js'

const columns = 'ailments.id, ailments.name, ailments.description, ailments.severity'

export type AilmentInput = Omit<Ailment, 'id'>

export const listAilments = (db: Db): Ailment[] =>
  db.prepare(`SELECT ${columns} FROM ailments ORDER BY name`).all() as Ailment[]

export const getAilment = (db: Db, id: number): Ailment | undefined =>
  db.prepare(`SELECT ${columns} FROM ailments WHERE id = ?`).get(id) as Ailment | undefined

export const listAilmentsForAgent = (db: Db, agentId: number): Ailment[] =>
  db
    .prepare(
      `SELECT ${columns} FROM ailments
       JOIN agent_ailments ON agent_ailments.ailment_id = ailments.id
       WHERE agent_ailments.agent_id = ?
       ORDER BY ailments.name`,
    )
    .all(agentId) as Ailment[]

export const createAilment = (db: Db, a: AilmentInput): number =>
  Number(
    db
      .prepare('INSERT INTO ailments (name, description, severity) VALUES (?, ?, ?)')
      .run(a.name, a.description, a.severity).lastInsertRowid,
  )

/** Returns false if there is no ailment with that id. */
export const updateAilment = (db: Db, id: number, a: AilmentInput): boolean =>
  db
    .prepare('UPDATE ailments SET name = ?, description = ?, severity = ? WHERE id = ?')
    .run(a.name, a.description, a.severity, id).changes > 0

/** Which agents have the ailment and which therapies treat it, ids in ascending order. */
export const getAilmentLinks = (db: Db, ailmentId: number): AilmentLinks => ({
  agentIds: (
    db.prepare('SELECT agent_id AS id FROM agent_ailments WHERE ailment_id = ? ORDER BY agent_id').all(ailmentId) as {
      id: number
    }[]
  ).map((row) => row.id),
  therapyIds: (
    db
      .prepare('SELECT therapy_id AS id FROM ailment_therapies WHERE ailment_id = ? ORDER BY therapy_id')
      .all(ailmentId) as { id: number }[]
  ).map((row) => row.id),
})

/** Replaces the ailment's agent and therapy links in one transaction. */
export const setAilmentLinks = (db: Db, ailmentId: number, { agentIds, therapyIds }: AilmentLinks) =>
  transaction(db, () => {
    db.prepare('DELETE FROM agent_ailments WHERE ailment_id = ?').run(ailmentId)
    db.prepare('DELETE FROM ailment_therapies WHERE ailment_id = ?').run(ailmentId)
    const insertAgent = db.prepare('INSERT OR IGNORE INTO agent_ailments (agent_id, ailment_id) VALUES (?, ?)')
    for (const agentId of agentIds) insertAgent.run(agentId, ailmentId)
    const insertTherapy = db.prepare('INSERT OR IGNORE INTO ailment_therapies (ailment_id, therapy_id) VALUES (?, ?)')
    for (const therapyId of therapyIds) insertTherapy.run(ailmentId, therapyId)
  })
