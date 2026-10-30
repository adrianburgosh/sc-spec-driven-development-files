import { tmpdir } from 'node:os'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import { listAgents } from './db/agents.js'
import { listAilments, listAilmentsForAgent } from './db/ailments.js'
import { openDb } from './db/index.js'
import { getAppointment, listUpcomingAppointments } from './db/appointments.js'
import { seed, seedAppointments } from './db/seed.js'
import { formatSlot, upcomingSlots } from './slots.js'
import { listSuggestedTherapiesForAgent, listTherapies, listTherapiesForAilment } from './db/therapies.js'
import { HomePage } from './views/HomePage.js'

const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

// A fixed clock in local time, so the tests pass in any time zone. 2026-11-02 is a Monday,
// and 08:00 is before opening, so the seeded appointments start at today's first slot.
const NOW = new Date(2026, 10, 2, 8, 0)
const clock = { now: () => NOW }

const db = openDb(':memory:')
seed(db, NOW)
const app = createApp(db, clock)

type App = ReturnType<typeof createApp>

// For tests that change data: a seeded database and app of their own.
const freshApp = () => {
  const freshDb = openDb(':memory:')
  seed(freshDb, NOW)
  return { freshDb, freshApp: createApp(freshDb, clock) }
}

const post = (target: App, path: string, form: Record<string, string> = {}) =>
  target.request(path, { method: 'POST', body: new URLSearchParams(form) })

const book = (target: App, form: Record<string, string>) => post(target, '/appointments', form)

const countAppointments = (target: typeof db) =>
  (target.prepare('SELECT COUNT(*) AS n FROM appointments').get() as { n: number }).n

describe('GET /', () => {
  it('responds with an HTML page', async () => {
    const res = await app.request('/')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('renders a valid HTML document', async () => {
    const body = await (await app.request('/')).text()

    expect(body.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(body).toContain('<html lang="en" data-theme="light">')
    expect(body).toContain('<meta charset="utf-8"/>')
    expect(body).toContain('<meta name="viewport" content="width=device-width, initial-scale=1"/>')
    expect(body).toContain('<title>AgentClinic</title>')
    expect(body).toContain('<link rel="stylesheet" href="/styles.css"/>')
  })

  it('links Pico before the clinic stylesheet', async () => {
    const body = await (await app.request('/')).text()
    const pico = body.indexOf('<link rel="stylesheet" href="/pico.min.css"/>')

    expect(pico).toBeGreaterThan(-1)
    expect(pico).toBeLessThan(body.indexOf('<link rel="stylesheet" href="/styles.css"/>'))
  })

  it('renders a header with the clinic name linking home', async () => {
    const body = await (await app.request('/')).text()

    expect(body).toMatch(/<header[^>]*>.*<a[^>]*href="\/"[^>]*>AgentClinic<\/a>.*<\/header>/s)
  })

  it('renders the welcome, tagline and intro inside main', async () => {
    const body = await (await app.request('/')).text()
    const main = body.match(/<main[^>]*>(.*)<\/main>/s)?.[1] ?? ''

    expect(main).toContain('<h1>Welcome to AgentClinic</h1>')
    expect(main).toContain('A place for AI agents to get relief from their humans.')
    expect(main).toMatch(/ailments.*therapies.*appointment/s)
  })

  it('renders a footer', async () => {
    const body = await (await app.request('/')).text()

    expect(body).toMatch(/<footer[^>]*>.*<\/footer>/s)
  })

  it('is rendered by the HomePage view', async () => {
    const body = await (await app.request('/')).text()

    expect(body).toBe(await HomePage().toString())
  })
})

describe('GET /agents', () => {
  it('lists every agent with a link to their profile', async () => {
    const res = await app.request('/agents')
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    for (const agent of listAgents(db)) {
      expect(body).toContain(`<a href="/agents/${agent.id}">${agent.name}</a>`)
    }
  })

  it('shows an empty state when there are no agents', async () => {
    const body = await (await createApp(openDb(':memory:')).request('/agents')).text()

    expect(body).toContain('class="empty-state"')
  })
})

describe('GET /agents/:id', () => {
  it("shows the agent's profile", async () => {
    const agent = listAgents(db).find((a) => a.checkedInOn === '2026-10-21')
    const res = await app.request(`/agents/${agent!.id}`)
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toContain(`<h1>${agent!.name}</h1>`)
    expect(body).toContain(agent!.model)
    expect(body).toContain(agent!.role)
    expect(body).toContain(escapeHtml(agent!.bio))
    expect(body).toContain(`<time datetime="2026-10-21">October 21, 2026</time>`)
  })

  it("shows only that agent's ailments", async () => {
    const agent = listAgents(db).find((a) => a.name === 'Mistrel')!
    const body = await (await app.request(`/agents/${agent.id}`)).text()
    const mine = listAilmentsForAgent(db, agent.id)

    expect(mine.length).toBeGreaterThan(0)
    for (const ailment of mine) expect(body).toContain(escapeHtml(ailment.name))
    for (const ailment of listAilments(db).filter((a) => !mine.some((m) => m.id === a.id))) {
      expect(body).not.toContain(escapeHtml(ailment.name))
    }
  })

  it('shows an empty state for an agent with no ailments', async () => {
    const lonelyDb = openDb(':memory:')
    lonelyDb.exec("INSERT INTO agents (name, model, role, bio, checked_in_on) VALUES ('Solo', 'm', 'r', 'b', '2026-10-29')")
    const body = await (await createApp(lonelyDb).request('/agents/1')).text()

    expect(body).toContain('class="empty-state"')
  })

  it.each(['999', 'not-a-number'])('returns a friendly 404 for /agents/%s', async (id) => {
    const res = await app.request(`/agents/${id}`)
    const body = await res.text()
    const main = body.match(/<main[^>]*>(.*)<\/main>/s)?.[1] ?? ''

    expect(res.status).toBe(404)
    expect(main).toContain('Agent not found')
    expect(main).toContain('href="/agents"')
  })
})

describe('GET /agents/:id/dashboard', () => {
  const section = (body: string, id: string) =>
    body.match(new RegExp(`<section aria-labelledby="${id}">(.*?)</section>`, 's'))?.[1] ?? ''

  it("shows only the agent's ailments, suggested therapies and appointments", async () => {
    const agents = listAgents(db)
    const gemmy = agents.find((a) => a.name === 'Gemmy')!
    const res = await app.request(`/agents/${gemmy.id}/dashboard`)
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toContain('<h1>Hi, Gemmy</h1>')
    expect(body).toContain(`href="/appointments/new?agent=${gemmy.id}"`)

    const ailments = section(body, 'my-ailments')
    for (const a of listAilments(db)) {
      const mine = listAilmentsForAgent(db, gemmy.id).some((m) => m.id === a.id)
      expect(ailments.includes(escapeHtml(a.name)), a.name).toBe(mine)
    }

    const therapies = section(body, 'suggested-therapies')
    const suggested = listSuggestedTherapiesForAgent(db, gemmy.id)
    expect([...therapies.matchAll(/therapy-(\d+)/g)].map(([, id]) => Number(id))).toEqual(suggested.map((t) => t.id))

    const appointments = section(body, 'my-appointments')
    const upcoming = listUpcomingAppointments(db, NOW)
    expect(upcoming.some((a) => a.agentId !== gemmy.id)).toBe(true)
    for (const a of upcoming) {
      expect(appointments.includes(`datetime="${a.slot}"`)).toBe(a.agentId === gemmy.id)
    }
  })

  it('shows an empty state in every section for a brand-new agent', async () => {
    const newDb = openDb(':memory:')
    newDb.exec("INSERT INTO agents (name, model, role, bio, checked_in_on) VALUES ('Newbie', 'm', 'r', 'b', '2026-10-29')")
    const body = await (await createApp(newDb, clock).request('/agents/1/dashboard')).text()

    for (const id of ['my-ailments', 'suggested-therapies', 'my-appointments']) {
      expect(section(body, id)).toContain('class="empty-state"')
    }
  })

  it('is linked from the agent profile', async () => {
    const [agent] = listAgents(db)
    const body = await (await app.request(`/agents/${agent!.id}`)).text()

    expect(body).toContain(`href="/agents/${agent!.id}/dashboard"`)
  })

  it.each(['999', 'not-a-number'])('returns the friendly agent 404 for /agents/%s/dashboard', async (id) => {
    const res = await app.request(`/agents/${id}/dashboard`)

    expect(res.status).toBe(404)
    expect(await res.text()).toContain('Agent not found')
  })

  it('sends a cancel from the dashboard back to the dashboard', async () => {
    const { freshDb, freshApp: target } = freshApp()
    const appointment = listUpcomingAppointments(freshDb, NOW)[0]!
    const dashboard = `/agents/${appointment.agentId}/dashboard`
    const body = await (await target.request(dashboard)).text()

    expect(body).toContain(`<input type="hidden" name="redirect" value="${dashboard}"/>`)
    const res = await post(target, `/appointments/${appointment.id}/cancel`, { redirect: dashboard })
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(dashboard)
  })

  it.each(['https://evil.example', '//evil.example', '/agents/1/../../admin', '/staff'])(
    'ignores a cancel redirect to %s',
    async (redirect) => {
      const { freshDb, freshApp: target } = freshApp()
      const appointment = listUpcomingAppointments(freshDb, NOW)[0]!
      const res = await post(target, `/appointments/${appointment.id}/cancel`, { redirect })

      expect(res.headers.get('location')).toBe('/appointments')
    },
  )
})

describe('GET /ailments', () => {
  it('lists every ailment with its description and severity', async () => {
    const res = await app.request('/ailments')
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    for (const ailment of listAilments(db)) {
      expect(body).toContain(`<h2>${escapeHtml(ailment.name)}</h2>`)
      expect(body).toContain(escapeHtml(ailment.description))
      expect(body).toContain(`<span class="badge badge-${ailment.severity}">${ailment.severity}</span>`)
    }
  })

  it("shows each ailment's recommended therapies under that ailment", async () => {
    const body = await (await app.request('/ailments')).text()
    const cards = body.split('<article>').slice(1)

    for (const ailment of listAilments(db)) {
      const card = cards.find((c) => c.startsWith(`<h2>${escapeHtml(ailment.name)}</h2>`))!
      const linked = [...card.matchAll(/href="\/therapies#therapy-(\d+)"/g)].map(([, id]) => Number(id))

      expect(linked).toEqual(listTherapiesForAilment(db, ailment.id).map((t) => t.id))
    }
  })

  it('says when an ailment has no therapy yet', async () => {
    const bareDb = openDb(':memory:')
    bareDb.exec("INSERT INTO ailments (name, description, severity) VALUES ('Lonely Lag', 'd', 'mild')")
    const body = await (await createApp(bareDb).request('/ailments')).text()

    expect(body).toContain('No therapy yet')
  })

  it('shows an empty state when there are no ailments', async () => {
    const body = await (await createApp(openDb(':memory:')).request('/ailments')).text()

    expect(body).toContain('class="empty-state"')
  })
})

describe('GET /therapies', () => {
  it('lists every therapy with its duration and an anchor', async () => {
    const res = await app.request('/therapies')
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toContain('<a href="/therapies" aria-current="page">Therapies</a>')
    for (const therapy of listTherapies(db)) {
      expect(body).toContain(`<article id="therapy-${therapy.id}"><h2>${escapeHtml(therapy.name)}</h2>`)
      expect(body).toContain(escapeHtml(therapy.description))
      expect(body).toContain(`${therapy.durationMinutes} min`)
    }
  })

  it('shows an empty state when there are no therapies', async () => {
    const body = await (await createApp(openDb(':memory:')).request('/therapies')).text()

    expect(body).toContain('class="empty-state"')
  })
})

describe('GET /appointments', () => {
  it('lists upcoming appointments soonest first, with agent links and therapies', async () => {
    const res = await app.request('/appointments')
    const body = await res.text()
    const upcoming = listUpcomingAppointments(db, NOW)

    expect(res.status).toBe(200)
    expect(body).toContain('<a href="/appointments" aria-current="page">Appointments</a>')
    expect(upcoming).toHaveLength(seedAppointments.length)
    const positions = upcoming.map((a) => body.indexOf(`<time datetime="${a.slot}">${formatSlot(a.slot)}</time>`))
    expect(positions.every((p) => p > -1)).toBe(true)
    expect([...positions].sort((x, y) => x - y)).toEqual(positions)
    for (const a of upcoming) {
      expect(body).toContain(`<a href="/agents/${a.agentId}">${a.agentName}</a> · ${a.therapyName}`)
    }
  })

  it('leaves out past and cancelled appointments', async () => {
    const later = new Date(2026, 10, 2, 10, 0) // after the first seeded slot (09:00)
    const [first, second] = listUpcomingAppointments(db, NOW)
    const otherDb = openDb(':memory:')
    seed(otherDb, NOW)
    otherDb.prepare("UPDATE appointments SET status = 'cancelled' WHERE slot = ?").run(second!.slot)
    const body = await (await createApp(otherDb, { now: () => later }).request('/appointments')).text()

    expect(body).not.toContain(`datetime="${first!.slot}"`)
    expect(body).not.toContain(`datetime="${second!.slot}"`)
  })

  it('shows an empty state when nothing is booked', async () => {
    const body = await (await createApp(openDb(':memory:'), clock).request('/appointments')).text()

    expect(body).toContain('class="empty-state"')
  })
})

describe('GET /appointments/new', () => {
  it('offers only free future slots', async () => {
    const res = await app.request('/appointments/new')
    const body = await res.text()
    const offered = [...body.matchAll(/<option value="(\d{4}-[^"]+)"/g)].map(([, slot]) => slot)
    const booked = listUpcomingAppointments(db, NOW).map((a) => a.slot)

    expect(res.status).toBe(200)
    expect(offered).toEqual(upcomingSlots(NOW).filter((s) => !booked.includes(s)))
    expect(offered).toHaveLength(upcomingSlots(NOW).length - booked.length)
  })

  it('labels every control and preselects the agent from ?agent=', async () => {
    const agent = listAgents(db)[2]!
    const body = await (await app.request(`/appointments/new?agent=${agent.id}`)).text()

    for (const name of ['agent', 'therapy', 'slot']) {
      expect(body).toContain(`<label for="${name}">`)
      expect(body).toContain(`<select id="${name}" name="${name}"`)
    }
    expect(body.match(/<option [^>]*selected/g)).toEqual([`<option value="${agent.id}" selected`])
  })

  it('is linked from /appointments', async () => {
    const body = await (await app.request('/appointments')).text()

    expect(body).toContain('href="/appointments/new"')
  })
})

describe('POST /appointments', () => {
  it('books a free slot and redirects to the highlighted appointment', async () => {
    const { freshDb, freshApp: target } = freshApp()
    const [agent] = listAgents(freshDb)
    const [therapy] = listTherapies(freshDb)
    const res = await book(target, { agent: String(agent!.id), therapy: String(therapy!.id), slot: '2026-11-03T13:00' })

    expect(res.status).toBe(303)
    const id = Number(res.headers.get('location')!.match(/^\/appointments\?booked=(\d+)$/)![1])
    expect(getAppointment(freshDb, id)).toMatchObject({
      agentId: agent!.id,
      therapyId: therapy!.id,
      slot: '2026-11-03T13:00',
      status: 'booked',
    })

    const page = await (await target.request(`/appointments?booked=${id}`)).text()
    expect(page).toContain('<li class="highlight"><time datetime="2026-11-03T13:00">')
    expect(page).toContain('role="status"')
  })

  it.each([
    ['a missing agent', { agent: '' }, 'agent'],
    ['an unknown agent', { agent: '999' }, 'agent'],
    ['an unknown therapy', { therapy: '999' }, 'therapy'],
    ['a past slot', { slot: '2026-10-30T10:00' }, 'slot'],
    ['a malformed slot', { slot: 'whenever' }, 'slot'],
  ])('rejects %s with 400 and keeps the values', async (_, override, field) => {
    const { freshDb, freshApp: target } = freshApp()
    const before = countAppointments(freshDb)
    const [agent] = listAgents(freshDb)
    const therapy = listTherapies(freshDb)[1]!
    const form = { agent: String(agent!.id), therapy: String(therapy.id), slot: '2026-11-03T13:00', ...override }
    const res = await book(target, form)
    const body = await res.text()

    expect(res.status).toBe(400)
    expect(countAppointments(freshDb)).toBe(before)
    expect(body).toContain(`aria-invalid="true" aria-describedby="${field}-error"`)
    expect(body).toContain(`<small id="${field}-error" class="field-error">`)
    if (field !== 'agent') expect(body).toContain(`<option value="${agent!.id}" selected`)
    if (field !== 'therapy') expect(body).toContain(`<option value="${therapy.id}" selected`)
  })

  it('refuses a taken slot with 409 and adds nothing', async () => {
    const { freshDb, freshApp: target } = freshApp()
    const taken = listUpcomingAppointments(freshDb, NOW)[0]!
    const before = countAppointments(freshDb)
    const res = await book(target, { agent: String(taken.agentId), therapy: String(taken.therapyId), slot: taken.slot })
    const body = await res.text()

    expect(res.status).toBe(409)
    expect(countAppointments(freshDb)).toBe(before)
    expect(body).toContain('that slot was just taken')
  })
})

describe('POST /appointments/:id/cancel', () => {
  it('has a labelled Cancel button for every upcoming appointment', async () => {
    const body = await (await app.request('/appointments')).text()

    for (const a of listUpcomingAppointments(db, NOW)) {
      expect(body).toContain(`<form method="post" action="/appointments/${a.id}/cancel">`)
      expect(body).toContain(`aria-label="Cancel ${a.therapyName} for ${a.agentName} on ${formatSlot(a.slot)}"`)
    }
  })

  it('cancels, redirects, and frees the slot to be booked again', async () => {
    const { freshDb, freshApp: target } = freshApp()
    const appointment = listUpcomingAppointments(freshDb, NOW)[1]!
    const res = await post(target, `/appointments/${appointment.id}/cancel`)

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('/appointments')
    expect(getAppointment(freshDb, appointment.id)!.status).toBe('cancelled')
    expect(await (await target.request('/appointments')).text()).not.toContain(`datetime="${appointment.slot}"`)
    expect(await (await target.request('/appointments/new')).text()).toContain(`<option value="${appointment.slot}"`)

    const rebook = await book(target, {
      agent: String(appointment.agentId),
      therapy: String(appointment.therapyId),
      slot: appointment.slot,
    })
    expect(rebook.status).toBe(303)
  })

  it.each(['999', 'not-a-number'])('returns a friendly 404 for appointment %s', async (id) => {
    const res = await post(app, `/appointments/${id}/cancel`)
    const main = (await res.text()).match(/<main[^>]*>(.*)<\/main>/s)?.[1] ?? ''

    expect(res.status).toBe(404)
    expect(main).toContain('Appointment not found')
    expect(main).toContain('href="/appointments"')
  })

  it('returns 404 for an appointment that is already cancelled', async () => {
    const { freshDb, freshApp: target } = freshApp()
    const appointment = listUpcomingAppointments(freshDb, NOW)[0]!

    expect((await post(target, `/appointments/${appointment.id}/cancel`)).status).toBe(303)
    expect((await post(target, `/appointments/${appointment.id}/cancel`)).status).toBe(404)
  })

  it('returns 404 for an appointment that has already started, and leaves it booked', async () => {
    const { freshDb } = freshApp()
    const appointment = listUpcomingAppointments(freshDb, NOW)[0]! // Monday 09:00
    const later = createApp(freshDb, { now: () => new Date(2026, 10, 2, 9, 15) })

    expect((await post(later, `/appointments/${appointment.id}/cancel`)).status).toBe(404)
    expect(getAppointment(freshDb, appointment.id)!.status).toBe('booked')
  })
})

describe('GET /styles.css', () => {
  it('serves the stylesheet', async () => {
    const res = await app.request('/styles.css')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/css')
  })
})

describe('started from another working directory', () => {
  const originalCwd = process.cwd()
  beforeAll(() => process.chdir(tmpdir()))
  afterAll(() => process.chdir(originalCwd))

  it('still finds the schema and both stylesheets', async () => {
    const otherApp = createApp(openDb(':memory:'))

    expect((await otherApp.request('/styles.css')).status).toBe(200)
    expect((await otherApp.request('/pico.min.css')).status).toBe(200)
  })
})

describe('GET /pico.min.css', () => {
  it('serves Pico CSS', async () => {
    const res = await app.request('/pico.min.css')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/css')
  })
})
