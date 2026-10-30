import { describe, expect, it } from 'vitest'
import { getAgent, listAgents } from './agents.js'
import { listAilments, listAilmentsForAgent } from './ailments.js'
import { migrate, openDb, type Db } from './index.js'
import { seed, seedAgentAilments, seedAgents, seedAilments } from './seed.js'

const count = (db: Db, table: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n

const tableNames = (db: Db) =>
  db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((row) => row.name)

const insertAilment = (db: Db, name: string, severity: string) =>
  db
    .prepare('INSERT INTO ailments (name, description, severity) VALUES (?, ?, ?)')
    .run(name, 'Test ailment.', severity)

describe('migration', () => {
  it('creates every table', () => {
    const db = openDb(':memory:')

    expect(tableNames(db)).toEqual(['agent_ailments', 'agents', 'ailments'])
  })

  it("cascades an agent's ailment links when the agent is deleted", () => {
    const db = openDb(':memory:')
    seed(db)
    const [first] = listAgents(db)
    db.prepare('DELETE FROM agents WHERE id = ?').run(first!.id)

    expect(db.prepare('SELECT * FROM agent_ailments WHERE agent_id = ?').all(first!.id)).toEqual([])
  })

  it('is safe to run twice and keeps existing data', () => {
    const db = openDb(':memory:')
    seed(db)

    expect(() => migrate(db)).not.toThrow()
    expect(listAgents(db)).toHaveLength(seedAgents.length)
    expect(listAilments(db)).toHaveLength(seedAilments.length)
  })

  it('accepts the known ailment severities', () => {
    const db = openDb(':memory:')

    for (const severity of ['mild', 'moderate', 'severe']) {
      expect(() => insertAilment(db, `A ${severity} case`, severity)).not.toThrow()
    }
  })

  it('rejects an unknown ailment severity', () => {
    const db = openDb(':memory:')

    expect(() => insertAilment(db, 'Mystery Lag', 'catastrophic')).toThrow(/CHECK constraint failed/)
  })
})

describe('seed', () => {
  it('inserts the sample agents and ailments', () => {
    const db = openDb(':memory:')
    seed(db)

    expect(listAgents(db)).toHaveLength(seedAgents.length)
    expect(listAilments(db)).toHaveLength(seedAilments.length)
  })

  it('does not duplicate rows when run twice', () => {
    const db = openDb(':memory:')
    seed(db)
    seed(db)

    expect(listAgents(db)).toHaveLength(seedAgents.length)
    expect(listAilments(db)).toHaveLength(seedAilments.length)
    expect(count(db, 'agent_ailments')).toBe(Object.values(seedAgentAilments).flat().length)
  })

  it('links agents to the ailments in the seed data', () => {
    const db = openDb(':memory:')
    seed(db)

    for (const agent of listAgents(db)) {
      expect(listAilmentsForAgent(db, agent.id).map((a) => a.name)).toEqual(
        [...seedAgentAilments[agent.name]!].sort(),
      )
    }
  })
})

describe('data access', () => {
  // Rows are inserted out of order, so the lists are only sorted if the query sorts them.
  it('lists agents sorted by name', () => {
    const db = openDb(':memory:')
    const insert = db.prepare(
      "INSERT INTO agents (name, model, role, bio, checked_in_on) VALUES (?, 'm', 'r', 'b', '2026-10-29')",
    )
    for (const name of ['Zed', 'Abe', 'Mo']) insert.run(name)

    expect(listAgents(db).map((a) => a.name)).toEqual(['Abe', 'Mo', 'Zed'])
  })

  it('lists ailments sorted by name', () => {
    const db = openDb(':memory:')
    for (const name of ['Zap Lag', 'Ache', 'Mild Glitch']) insertAilment(db, name, 'mild')

    expect(listAilments(db).map((a) => a.name)).toEqual(['Ache', 'Mild Glitch', 'Zap Lag'])
  })

  it("lists an agent's ailments sorted by name, and none for an agent without links", () => {
    const db = openDb(':memory:')
    for (const name of ['Zap Lag', 'Ache', 'Mild Glitch']) insertAilment(db, name, 'mild')
    const insertAgent = db.prepare(
      "INSERT INTO agents (name, model, role, bio, checked_in_on) VALUES (?, 'm', 'r', 'b', '2026-10-29')",
    )
    const sick = Number(insertAgent.run('Sick').lastInsertRowid)
    const well = Number(insertAgent.run('Well').lastInsertRowid)
    db.exec(`INSERT INTO agent_ailments (agent_id, ailment_id) SELECT ${sick}, id FROM ailments WHERE name != 'Mild Glitch'`)

    expect(listAilmentsForAgent(db, sick).map((a) => a.name)).toEqual(['Ache', 'Zap Lag'])
    expect(listAilmentsForAgent(db, well)).toEqual([])
  })

  it('gets one agent by id', () => {
    const db = openDb(':memory:')
    seed(db)
    const [first] = listAgents(db)

    expect(getAgent(db, first!.id)).toEqual(first)
  })

  it('returns undefined for an unknown agent', () => {
    const db = openDb(':memory:')
    seed(db)

    expect(getAgent(db, 999)).toBeUndefined()
  })
})
