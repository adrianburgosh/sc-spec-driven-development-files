import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import { getAgent, listAgents } from './db/agents.js'
import { getAilment, getAilmentLinks, listAilments } from './db/ailments.js'
import { openDb } from './db/index.js'
import { seed } from './db/seed.js'
import { getTherapy, listTherapies } from './db/therapies.js'

// Local time, so the tests pass in any time zone. 2026-11-02 is a Monday.
const NOW = new Date(2026, 10, 2, 8, 0)

// Every test gets its own seeded database, since most of them change data.
const setup = () => {
  const db = openDb(':memory:')
  seed(db, NOW)
  return { db, app: createApp(db, { now: () => NOW }) }
}

const post = (app: ReturnType<typeof createApp>, path: string, form: [string, string][] | Record<string, string>) =>
  app.request(path, { method: 'POST', body: new URLSearchParams(form) })

const count = (db: ReturnType<typeof openDb>, table: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n

const newAgent = { name: 'Tokenly', model: 'Tiny-ish 1B', role: 'Haiku writer', bio: 'Writes in 17 syllables.', checkedInOn: '2026-10-30' }
const newTherapy = { name: 'Nap Mode', description: 'Literally just sleep().', durationMinutes: '20' }

describe('staff dashboard management lists', () => {
  it('links to add every kind of record and to edit each one', async () => {
    const { db, app } = setup()
    const body = await (await app.request('/staff')).text()

    for (const path of ['agents', 'ailments', 'therapies']) expect(body).toContain(`href="/staff/${path}/new"`)
    for (const a of listAgents(db)) expect(body).toContain(`href="/staff/agents/${a.id}/edit"`)
    for (const a of listAilments(db)) expect(body).toContain(`href="/staff/ailments/${a.id}/edit"`)
    for (const t of listTherapies(db)) expect(body).toContain(`href="/staff/therapies/${t.id}/edit"`)
  })
})

describe('staff agent forms', () => {
  it('shows an empty add form with today as the check-in date', async () => {
    const { app } = setup()
    const res = await app.request('/staff/agents/new')
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toContain('<form method="post" action="/staff/agents"')
    expect(body).toContain('value="2026-11-02"')
  })

  it('adds an agent and redirects to their profile', async () => {
    const { db, app } = setup()
    const res = await post(app, '/staff/agents', newAgent)

    expect(res.status).toBe(303)
    const id = Number(res.headers.get('location')!.match(/^\/agents\/(\d+)$/)![1])
    expect(getAgent(db, id)).toEqual({ id, ...newAgent })
  })

  it('edits an agent, starting from their current details', async () => {
    const { db, app } = setup()
    const [agent] = listAgents(db)
    const form = await (await app.request(`/staff/agents/${agent!.id}/edit`)).text()

    expect(form).toContain(`action="/staff/agents/${agent!.id}"`)
    expect(form).toContain(`value="${agent!.name}"`)
    const res = await post(app, `/staff/agents/${agent!.id}`, { ...newAgent, name: 'Botley Prime' })
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(`/agents/${agent!.id}`)
    expect(getAgent(db, agent!.id)!.name).toBe('Botley Prime')
  })

  it('re-renders invalid input with 400, the values kept and the errors shown', async () => {
    const { db, app } = setup()
    const before = count(db, 'agents')
    const res = await post(app, '/staff/agents', { ...newAgent, role: '  ', checkedInOn: 'someday' })
    const body = await res.text()

    expect(res.status).toBe(400)
    expect(count(db, 'agents')).toBe(before)
    expect(body).toContain('value="Tokenly"')
    expect(body).toContain('<small id="role-error"')
    expect(body).toContain('<small id="checkedInOn-error"')
    expect(body).toContain('role="alert"')
  })
})

describe('staff ailment forms', () => {
  it('adds an ailment with its links and redirects to /ailments', async () => {
    const { db, app } = setup()
    const [a1, a2] = listAgents(db)
    const [t1] = listTherapies(db)
    const res = await post(app, '/staff/ailments', [
      ['name', 'Emoji Overload'],
      ['description', 'Too many 🎉.'],
      ['severity', 'mild'],
      ['agents', String(a1!.id)],
      ['agents', String(a2!.id)],
      ['therapies', String(t1!.id)],
    ])

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('/ailments')
    const created = listAilments(db).find((a) => a.name === 'Emoji Overload')!
    expect(created).toMatchObject({ description: 'Too many 🎉.', severity: 'mild' })
    expect(getAilmentLinks(db, created.id)).toEqual({ agentIds: [a1!.id, a2!.id], therapyIds: [t1!.id] })
    expect(await (await app.request('/ailments')).text()).toContain('Emoji Overload')
  })

  it('pre-checks the current links on the edit form', async () => {
    const { db, app } = setup()
    const [ailment] = listAilments(db)
    const body = await (await app.request(`/staff/ailments/${ailment!.id}/edit`)).text()
    const links = getAilmentLinks(db, ailment!.id)
    const checked = (name: string) =>
      [...body.matchAll(new RegExp(`name="${name}" value="(\\d+)" checked`, 'g'))].map(([, id]) => Number(id))

    expect(checked('agents')).toEqual(links.agentIds)
    expect(checked('therapies')).toEqual(links.therapyIds)
  })

  it('replaces the links on edit, leaving no leftovers or duplicates', async () => {
    const { db, app } = setup()
    const [ailment] = listAilments(db)
    const agents = listAgents(db)
    const therapies = listTherapies(db)
    const res = await post(app, `/staff/ailments/${ailment!.id}`, [
      ['name', ailment!.name],
      ['description', ailment!.description],
      ['severity', 'severe'],
      ['agents', String(agents[4]!.id)],
      ['agents', String(agents[4]!.id)],
      ['therapies', String(therapies[2]!.id)],
    ])

    expect(res.status).toBe(303)
    expect(getAilment(db, ailment!.id)!.severity).toBe('severe')
    expect(getAilmentLinks(db, ailment!.id)).toEqual({ agentIds: [agents[4]!.id], therapyIds: [therapies[2]!.id] })
  })

  it('keeps the checked boxes when the form is invalid', async () => {
    const { db, app } = setup()
    const [agent] = listAgents(db)
    const res = await post(app, '/staff/ailments', [
      ['name', ''],
      ['description', 'd'],
      ['severity', 'mild'],
      ['agents', String(agent!.id)],
    ])
    const body = await res.text()

    expect(res.status).toBe(400)
    expect(body).toContain(`name="agents" value="${agent!.id}" checked`)
    expect(body).toContain('<small id="name-error"')
  })

  it('rejects a link to an agent that does not exist', async () => {
    const { db, app } = setup()
    const [ailment] = listAilments(db)
    const before = getAilmentLinks(db, ailment!.id)
    const res = await post(app, `/staff/ailments/${ailment!.id}`, [
      ['name', 'X'],
      ['description', 'Y'],
      ['severity', 'mild'],
      ['agents', '999'],
    ])

    expect(res.status).toBe(400)
    expect(getAilmentLinks(db, ailment!.id)).toEqual(before)
    expect(getAilment(db, ailment!.id)!.name).toBe(ailment!.name)
  })
})

describe('staff therapy forms', () => {
  it('adds a therapy and redirects to /therapies', async () => {
    const { db, app } = setup()
    const res = await post(app, '/staff/therapies', newTherapy)

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('/therapies')
    expect(listTherapies(db).find((t) => t.name === 'Nap Mode')).toMatchObject({ durationMinutes: 20 })
  })

  it("edits a therapy's duration", async () => {
    const { db, app } = setup()
    const [therapy] = listTherapies(db)
    const form = await (await app.request(`/staff/therapies/${therapy!.id}/edit`)).text()

    expect(form).toContain(`value="${therapy!.durationMinutes}"`)
    const res = await post(app, `/staff/therapies/${therapy!.id}`, {
      name: therapy!.name,
      description: therapy!.description,
      durationMinutes: '90',
    })
    expect(res.status).toBe(303)
    expect(getTherapy(db, therapy!.id)!.durationMinutes).toBe(90)
    expect(await (await app.request('/therapies')).text()).toContain('90 min')
  })

  it('re-renders an out-of-range duration with 400 and the values kept', async () => {
    const { db, app } = setup()
    const [therapy] = listTherapies(db)
    const res = await post(app, `/staff/therapies/${therapy!.id}`, { ...newTherapy, durationMinutes: '999' })
    const body = await res.text()

    expect(res.status).toBe(400)
    expect(body).toContain('value="999"')
    expect(body).toContain('<small id="durationMinutes-error"')
    expect(getTherapy(db, therapy!.id)).toEqual(therapy)
  })
})

describe('staff forms for unknown records', () => {
  it.each([
    ['agents', 'Agent'],
    ['ailments', 'Ailment'],
    ['therapies', 'Therapy'],
  ])('return 404 for /staff/%s/999 on GET and POST', async (path, thing) => {
    const { app } = setup()
    const forms = { agents: newAgent, ailments: { name: 'X', description: 'Y', severity: 'mild' }, therapies: newTherapy }

    for (const res of [
      await app.request(`/staff/${path}/999/edit`),
      await app.request(`/staff/${path}/not-a-number/edit`),
      await post(app, `/staff/${path}/999`, forms[path as keyof typeof forms]),
    ]) {
      expect(res.status).toBe(404)
      expect(await res.text()).toContain(`${thing} not found`)
    }
  })
})
