import type { Db } from './index.js'
import type { Agent } from '../types.js'

const columns = 'id, name, model, role, bio, checked_in_on AS checkedInOn'

export type AgentInput = Omit<Agent, 'id'>

export const listAgents = (db: Db): Agent[] =>
  db.prepare(`SELECT ${columns} FROM agents ORDER BY name`).all() as Agent[]

export const getAgent = (db: Db, id: number): Agent | undefined =>
  db.prepare(`SELECT ${columns} FROM agents WHERE id = ?`).get(id) as Agent | undefined

export const createAgent = (db: Db, a: AgentInput): number =>
  Number(
    db
      .prepare('INSERT INTO agents (name, model, role, bio, checked_in_on) VALUES (?, ?, ?, ?, ?)')
      .run(a.name, a.model, a.role, a.bio, a.checkedInOn).lastInsertRowid,
  )

/** Returns false if there is no agent with that id. */
export const updateAgent = (db: Db, id: number, a: AgentInput): boolean =>
  db
    .prepare('UPDATE agents SET name = ?, model = ?, role = ?, bio = ?, checked_in_on = ? WHERE id = ?')
    .run(a.name, a.model, a.role, a.bio, a.checkedInOn, id).changes > 0
