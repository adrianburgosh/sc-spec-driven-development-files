import { describe, expect, it } from 'vitest'
import { createAgent, getAgent, listAgents, updateAgent } from './agents.js'
import {
  createAilment,
  getAilment,
  getAilmentLinks,
  listAilments,
  listAilmentsForAgent,
  setAilmentLinks,
  updateAilment,
} from './ailments.js'
import { clinicCounts } from './clinic.js'
import { createFeedback, listFeedback } from './feedback.js'
import { migrate, openDb, transaction, type Db } from './index.js'
import {
  createAppointment,
  getAppointment,
  listAppointmentsOn,
  listFreeSlots,
  listUpcomingAppointments,
  listUpcomingAppointmentsForAgent,
  SlotTakenError,
} from './appointments.js'
import {
  seed,
  seedAgentAilments,
  seedAgents,
  seedAilments,
  seedAilmentTherapies,
  seedAppointments,
  seedFeedback,
  seedTherapies,
} from './seed.js'
import {
  createTherapy,
  getTherapy,
  listSuggestedTherapiesForAgent,
  listTherapies,
  listTherapiesByAilment,
  listTherapiesForAilment,
  updateTherapy,
} from './therapies.js'
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
      'feedback',
      'therapies',
    ])
  })

  it.each([
    ['empty', ''],
    ['blank', '   '],
    ['1001-character', 'a'.repeat(1001)],
  ])('rejects an %s feedback message', (_, message) => {
    const db = openDb(':memory:')

    expect(() => db.prepare('INSERT INTO feedback (message) VALUES (?)').run(message)).toThrow(/CHECK constraint failed/)
  })

  it('keeps feedback, now anonymous, when its agent is deleted', () => {
    const db = openDb(':memory:')
    seed(db)
    const [first] = listAgents(db)
    const id = createFeedback(db, { agentId: first!.id, message: 'Thanks!' })
    db.prepare('DELETE FROM agents WHERE id = ?').run(first!.id)

    expect(listFeedback(db).find((f) => f.id === id)).toMatchObject({ agentId: null, agentName: null, message: 'Thanks!' })
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
    expect(listFeedback(db)).toHaveLength(seedFeedback.length)
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
    expect(count(db, 'feedback')).toBe(seedFeedback.length)
  })

  it('inserts the sample feedback, linked to agents by name or anonymous', () => {
    const db = openDb(':memory:')
    seed(db)

    expect(
      listFeedback(db)
        .map((f) => ({ agent: f.agentName, message: f.message }))
        .sort((a, b) => a.message.localeCompare(b.message)),
    ).toEqual([...seedFeedback].sort((a, b) => a.message.localeCompare(b.message)))
    expect(seedFeedback.some((f) => f.agent === null)).toBe(true)
    expect(seedFeedback.some((f) => f.agent !== null)).toBe(true)
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

  it('lists free slots: upcoming ones minus booked ones, with cancelled ones freed', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    db.exec('DELETE FROM appointments')
    insertAppointment(db, '2026-11-02T10:00')
    insertAppointment(db, '2026-11-02T11:00', 'cancelled')

    const free = listFreeSlots(db, monday8am)
    expect(free).not.toContain('2026-11-02T10:00')
    expect(free).toContain('2026-11-02T11:00')
    expect(free).toHaveLength(upcomingSlots(monday8am).length - 1)
  })

  it('creates an appointment, and throws SlotTakenError for a booked slot', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    const [agent] = listAgents(db)
    const [therapy] = listTherapies(db)
    const booking = { agentId: agent!.id, therapyId: therapy!.id, slot: '2026-11-05T15:00' }
    const id = createAppointment(db, booking)

    expect(getAppointment(db, id)).toMatchObject({ ...booking, status: 'booked' })
    expect(() => createAppointment(db, booking)).toThrow(SlotTakenError)
  })

  it('does not disguise other insert errors as a taken slot', () => {
    const db = openDb(':memory:')

    expect(() => createAppointment(db, { agentId: 1, therapyId: 1, slot: '2026-11-05T15:00' })).toThrow(
      /FOREIGN KEY constraint failed/,
    )
  })

  it("suggests each therapy for an agent's ailments once, sorted by name", () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    const botley = listAgents(db).find((a) => a.name === 'Botley')!

    // Botley's two ailments both list Guided Ambiguity Tolerance.
    expect(listSuggestedTherapiesForAgent(db, botley.id).map((t) => t.name)).toEqual([
      'Context Window Detox',
      'Guided Ambiguity Tolerance',
      'Scope Boundary Coaching',
    ])
  })

  it("lists only the agent's own upcoming booked appointments", () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    const all = listUpcomingAppointments(db, monday8am)
    const [first] = all

    expect(listUpcomingAppointmentsForAgent(db, first!.agentId, monday8am)).toEqual(
      all.filter((a) => a.agentId === first!.agentId),
    )
    db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(first!.id)
    expect(listUpcomingAppointmentsForAgent(db, first!.agentId, monday8am)).toEqual([])
  })

  it('lists the booked appointments on one day, past or future, by time', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    db.exec('DELETE FROM appointments')
    insertAppointment(db, '2026-11-02T15:00')
    insertAppointment(db, '2026-11-02T09:00')
    insertAppointment(db, '2026-11-02T11:00', 'cancelled')
    insertAppointment(db, '2026-11-03T09:00')

    expect(listAppointmentsOn(db, '2026-11-02').map((a) => a.slot)).toEqual(['2026-11-02T09:00', '2026-11-02T15:00'])
  })

  it('counts agents, ailments, therapies and upcoming booked appointments', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    const [first] = listUpcomingAppointments(db, monday8am)
    db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(first!.id)

    expect(clinicCounts(db, monday8am)).toEqual({
      agents: seedAgents.length,
      ailments: seedAilments.length,
      therapies: seedTherapies.length,
      upcomingAppointments: seedAppointments.length - 1,
    })
  })

  it('creates and updates an agent', () => {
    const db = openDb(':memory:')
    const input = { name: 'Neo', model: 'm', role: 'r', bio: 'b', checkedInOn: '2026-10-30' }
    const id = createAgent(db, input)

    expect(getAgent(db, id)).toEqual({ id, ...input })
    expect(updateAgent(db, id, { ...input, name: 'Neo 2' })).toBe(true)
    expect(getAgent(db, id)!.name).toBe('Neo 2')
    expect(updateAgent(db, 999, input)).toBe(false)
  })

  it('creates and updates an ailment', () => {
    const db = openDb(':memory:')
    const input = { name: 'Lag', description: 'd', severity: 'mild' as const }
    const id = createAilment(db, input)

    expect(getAilment(db, id)).toEqual({ id, ...input })
    expect(updateAilment(db, id, { ...input, severity: 'severe' })).toBe(true)
    expect(getAilment(db, id)!.severity).toBe('severe')
    expect(updateAilment(db, 999, input)).toBe(false)
  })

  it('creates and updates a therapy', () => {
    const db = openDb(':memory:')
    const input = { name: 'Nap', description: 'd', durationMinutes: 20 }
    const id = createTherapy(db, input)

    expect(getTherapy(db, id)).toEqual({ id, ...input })
    expect(updateTherapy(db, id, { ...input, durationMinutes: 25 })).toBe(true)
    expect(getTherapy(db, id)!.durationMinutes).toBe(25)
    expect(updateTherapy(db, 999, input)).toBe(false)
  })

  it("replaces an ailment's links without touching other ailments", () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    const [first, second] = listAilments(db)
    const otherBefore = getAilmentLinks(db, second!.id)
    const [a1, a2] = listAgents(db)
    const [t1] = listTherapies(db)

    setAilmentLinks(db, first!.id, { agentIds: [a2!.id, a1!.id], therapyIds: [t1!.id] })
    expect(getAilmentLinks(db, first!.id)).toEqual({ agentIds: [a1!.id, a2!.id].sort((x, y) => x - y), therapyIds: [t1!.id] })

    setAilmentLinks(db, first!.id, { agentIds: [], therapyIds: [] })
    expect(getAilmentLinks(db, first!.id)).toEqual({ agentIds: [], therapyIds: [] })
    expect(getAilmentLinks(db, second!.id)).toEqual(otherBefore)
  })

  it('rolls back the link change if a link is invalid', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    const [ailment] = listAilments(db)
    const before = getAilmentLinks(db, ailment!.id)

    expect(() => setAilmentLinks(db, ailment!.id, { agentIds: [999], therapyIds: [] })).toThrow(/FOREIGN KEY/)
    expect(getAilmentLinks(db, ailment!.id)).toEqual(before)
  })

  it('rolls back the whole transaction, including nested ones, when anything fails', () => {
    const db = openDb(':memory:')
    seed(db, monday8am)
    const [ailment] = listAilments(db)
    const before = getAilmentLinks(db, ailment!.id)

    expect(() =>
      transaction(db, () => {
        updateAilment(db, ailment!.id, { ...ailment!, name: 'Renamed' })
        setAilmentLinks(db, ailment!.id, { agentIds: [999], therapyIds: [] })
      }),
    ).toThrow(/FOREIGN KEY/)
    expect(getAilment(db, ailment!.id)!.name).toBe(ailment!.name)
    expect(getAilmentLinks(db, ailment!.id)).toEqual(before)
    expect(db.isTransaction).toBe(false)
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

  it("creates feedback with the agent's name, or anonymous", () => {
    const db = openDb(':memory:')
    seed(db)
    const [agent] = listAgents(db)
    const signed = createFeedback(db, { agentId: agent!.id, message: 'Signed' })
    const anonymous = createFeedback(db, { agentId: null, message: 'Anonymous' })
    const byId = new Map(listFeedback(db).map((f) => [f.id, f]))

    expect(byId.get(signed)).toMatchObject({ agentId: agent!.id, agentName: agent!.name, message: 'Signed' })
    expect(byId.get(anonymous)).toMatchObject({ agentId: null, agentName: null, message: 'Anonymous' })
    expect(byId.get(signed)!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('lists feedback newest first, breaking same-second ties by id', () => {
    const db = openDb(':memory:')
    const insert = db.prepare('INSERT INTO feedback (message, created_at) VALUES (?, ?)')
    insert.run('older', '2026-10-30 09:00:00')
    insert.run('newest', '2026-10-30 11:00:00')
    insert.run('same second, first', '2026-10-30 10:00:00')
    insert.run('same second, second', '2026-10-30 10:00:00')

    expect(listFeedback(db).map((f) => f.message)).toEqual([
      'newest',
      'same second, second',
      'same second, first',
      'older',
    ])
  })
})
