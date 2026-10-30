import type { Db } from './index.js'
import type { Ailment } from '../types.js'

const columns = 'ailments.id, ailments.name, ailments.description, ailments.severity'

export const listAilments = (db: Db): Ailment[] =>
  db.prepare(`SELECT ${columns} FROM ailments ORDER BY name`).all() as Ailment[]

export const listAilmentsForAgent = (db: Db, agentId: number): Ailment[] =>
  db
    .prepare(
      `SELECT ${columns} FROM ailments
       JOIN agent_ailments ON agent_ailments.ailment_id = ailments.id
       WHERE agent_ailments.agent_id = ?
       ORDER BY ailments.name`,
    )
    .all(agentId) as Ailment[]
