import { describe, expect, it } from 'vitest'
import { getAgent, listAgents } from './agents.js'
import { listAilments, listAilmentsForAgent } from './ailments.js'
import { migrate, openDb, type Db } from './index.js'
import { getAppointment, listUpcomingAppointments } from './appointments.js'
import {
  seed,
  seedAgentAilments,
  seedAgents,
  seedAilments,
  seedAilmentTherapies,
  seedAppointments,
  seedTherapies,
} from './seed.js'
import { getTherapy, listTherapies, listTherapiesByAilment, listTherapiesForAilment } from './therapies.js'
import { upcomingSlots } from '../slots.js'

// Local time, so the tests pass in any time zone. 2026-11-02 is a Monday.
const monday8am = new Date(2026, 10, 2, 8, 0)

const count = (db: Db, table: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n

// Books the first seeded agent into the first seeded therapy.
const insertAppointment = (db: Db, slot: string, status = 'booked') =>
  db
    .prepare(
      `INSERT INTO appointments (agent_id, therapy_id, slot, status)
       VALUES ((SELECT MIN(id) FROM agents), (SELECT MIN(id) FROM therapies), ?, ?)`,
    )
    .run(slot, status)

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

    expect(tableNames(db)).toEqual([
      'agent_ailments',
      'agents',
      'ailment_therapies',
      'ailments',
      'appointments',
      'therapies',
    ])
  })

  it('rejects an unknown appointment status', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)

    expect(() => insertAppointment(db, '2026-11-20T10:00', 'postponed')).toThrow(/CHECK constraint failed/)
  })

  it('rejects a second booked appointment in the same slot', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    insertAppointment(db, '2026-11-20T10:00')

    expect(() => insertAppointment(db, '2026-11-20T10:00')).toThrow(/UNIQUE constraint failed/)
  })

  it('allows a booked appointment next to cancelled ones in the same slot', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    insertAppointment(db, '2026-11-20T10:00', 'cancelled')
    insertAppointment(db, '2026-11-20T10:00', 'cancelled')

    expect(() => insertAppointment(db, '2026-11-20T10:00')).not.toThrow()
  })

  it.each([0, -15])('rejects a therapy lasting %i minutes', (minutes) => {
    const db = openDb(':memory:')
    const insert = db.prepare("INSERT INTO therapies (name, description, duration_minutes) VALUES ('T', 'd', ?)")

    expect(() => insert.run(minutes)).toThrow(/CHECK constraint failed/)
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
    expect(listTherapies(db)).toHaveLength(seedTherapies.length)
    expect(count(db, 'ailment_therapies')).toBe(Object.values(seedAilmentTherapies).flat().length)
    expect(count(db, 'appointments')).toBe(seedAppointments.length)
  })

  it('books the seed appointments on upcoming slots after the seed time', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    const slots = upcomingSlots(monday8am)

    expect(listUpcomingAppointments(db, monday8am).map((a) => [a.agentName, a.therapyName, a.slot])).toEqual(
      seedAppointments.map((a) => [a.agent, a.therapy, slots[a.nthSlot]]),
    )
  })

  it('gives every ailment at least one therapy', () => {
    const db = openDb(':memory:')
    seed(db)

    for (const ailment of listAilments(db)) {
      expect(listTherapiesForAilment(db, ailment.id).map((t) => t.name)).toEqual(
        [...seedAilmentTherapies[ailment.name]!].sort(),
      )
    }
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

  it('lists therapies sorted by name, and gets one by id', () => {
    const db = openDb(':memory:')
    const insert = db.prepare("INSERT INTO therapies (name, description, duration_minutes) VALUES (?, 'd', 30)")
    for (const name of ['Zen', 'Air', 'Mud']) insert.run(name)
    const therapies = listTherapies(db)

    expect(therapies.map((t) => t.name)).toEqual(['Air', 'Mud', 'Zen'])
    expect(getTherapy(db, therapies[0]!.id)).toEqual({ id: therapies[0]!.id, name: 'Air', description: 'd', durationMinutes: 30 })
    expect(getTherapy(db, 999)).toBeUndefined()
  })

  it('maps every ailment to the same therapies as the single-ailment lookup', () => {
    const db = openDb(':memory:')
    seed(db)
    insertAilment(db, 'Untreated Glitch', 'mild')
    const byAilment = listTherapiesByAilment(db)

    for (const ailment of listAilments(db)) {
      expect(byAilment.get(ailment.id) ?? []).toEqual(listTherapiesForAilment(db, ailment.id))
    }
    expect(byAilment.has(listAilments(db).find((a) => a.name === 'Untreated Glitch')!.id)).toBe(false)
  })

  it('lists only booked appointments that start after now, soonest first', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    db.exec('DELETE FROM appointments')
    insertAppointment(db, '2026-11-04T10:00')
    insertAppointment(db, '2026-11-02T09:00') // started before "now" below
    insertAppointment(db, '2026-11-03T15:00', 'cancelled')
    insertAppointment(db, '2026-11-02T14:00')
    insertAppointment(db, '2026-11-03T11:00')

    expect(listUpcomingAppointments(db, new Date(2026, 10, 2, 9, 30)).map((a) => a.slot)).toEqual([
      '2026-11-02T14:00',
      '2026-11-03T11:00',
      '2026-11-04T10:00',
    ])
  })

  it('gets one appointment by id, with agent and therapy names', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    const [first] = listUpcomingAppointments(db, monday8am)

    expect(getAppointment(db, first!.id)).toEqual(first)
    expect(first).toMatchObject({ agentName: 'Botley', therapyName: 'Guided Ambiguity Tolerance', status: 'booked' })
    expect(getAppointment(db, 999)).toBeUndefined()
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
