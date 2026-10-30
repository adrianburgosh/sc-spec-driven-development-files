import { describe, expect, it } from 'vitest'
import { getAgent, listAgents } from './agents.js'
import { listAilments } from './ailments.js'
import { migrate, openDb } from './index.js'
import { seed, seedAgents, seedAilments } from './seed.js'

const tableNames = (db: ReturnType<typeof openDb>) =>
  db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((row) => row.name)

describe('migration', () => {
  it('creates the agents and ailments tables', () => {
    const db = openDb(':memory:')

    expect(tableNames(db)).toEqual(['agents', 'ailments'])
  })

  it('is safe to run twice', () => {
    const db = openDb(':memory:')

    expect(() => migrate(db)).not.toThrow()
  })

  it('rejects an unknown ailment severity', () => {
    const db = openDb(':memory:')
    const insert = db.prepare('INSERT INTO ailments (name, description, severity) VALUES (?, ?, ?)')

    expect(() => insert.run('Mystery Lag', 'Nobody knows.', 'catastrophic')).toThrow()
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
  })
})

describe('data access', () => {
  const db = openDb(':memory:')
  seed(db)

  const sortedByName = (rows: { name: string }[]) =>
    rows.map((r) => r.name).sort()

  it('lists agents sorted by name', () => {
    const agents = listAgents(db)

    expect(agents.map((a) => a.name)).toEqual(sortedByName(agents))
  })

  it('lists ailments sorted by name', () => {
    const ailments = listAilments(db)

    expect(ailments.map((a) => a.name)).toEqual(sortedByName(ailments))
  })

  it('gets one agent by id', () => {
    const [first] = listAgents(db)

    expect(getAgent(db, first!.id)).toEqual(first)
  })

  it('returns undefined for an unknown agent', () => {
    expect(getAgent(db, 999)).toBeUndefined()
  })
})
