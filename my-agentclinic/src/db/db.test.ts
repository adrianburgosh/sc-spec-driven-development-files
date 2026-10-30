import { describe, expect, it } from 'vitest'
import { migrate, openDb } from './index.js'

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
