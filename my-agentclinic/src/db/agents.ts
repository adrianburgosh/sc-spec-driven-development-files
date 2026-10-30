import type { Db } from './index.js'
import type { Agent } from '../types.js'

const columns = 'id, name, model, role, bio, checked_in_on AS checkedInOn'

export const listAgents = (db: Db): Agent[] =>
  db.prepare(`SELECT ${columns} FROM agents ORDER BY name`).all() as Agent[]

export const getAgent = (db: Db, id: number): Agent | undefined =>
  db.prepare(`SELECT ${columns} FROM agents WHERE id = ?`).get(id) as Agent | undefined
