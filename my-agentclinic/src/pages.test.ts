// Checks that hold for every page: it renders in the layout, has one <h1>, and its forms are accessible.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApp } from './app.js'
import { listAgents } from './db/agents.js'
import { listAilments } from './db/ailments.js'
import { openDb } from './db/index.js'
import { seed } from './db/seed.js'
import { listTherapies } from './db/therapies.js'

// Local time, so the tests pass in any time zone. 2026-11-02 is a Monday.
const NOW = new Date(2026, 10, 2, 8, 0)

const db = openDb(':memory:')
seed(db, NOW)
const app = createApp(db, { now: () => NOW })
const emptyApp = createApp(openDb(':memory:'), { now: () => NOW })

const [agent] = listAgents(db)
const [ailment] = listAilments(db)
const [therapy] = listTherapies(db)

const post = (path: string, form: Record<string, string>) =>
  app.request(path, { method: 'POST', body: new URLSearchParams(form) })

// Every page a visitor can reach, including empty, invalid-form and not-found states.
const pages: [string, () => Response | Promise<Response>][] = [
  ['home', () => app.request('/')],
  ['agents', () => app.request('/agents')],
  ['agents (empty)', () => emptyApp.request('/agents')],
  ['agent profile', () => app.request(`/agents/${agent!.id}`)],
  ['agent not found', () => app.request('/agents/999')],
  ['agent dashboard', () => app.request(`/agents/${agent!.id}/dashboard`)],
  ['ailments', () => app.request('/ailments')],
  ['ailments (empty)', () => emptyApp.request('/ailments')],
  ['therapies', () => app.request('/therapies')],
  ['therapies (empty)', () => emptyApp.request('/therapies')],
  ['appointments', () => app.request('/appointments')],
  ['appointments (empty)', () => emptyApp.request('/appointments')],
  ['booking form', () => app.request('/appointments/new')],
  ['booking form (invalid)', () => post('/appointments', { agent: '', therapy: '', slot: '' })],
  ['booking form (empty clinic)', () => emptyApp.request('/appointments/new')],
  ['cancel not found', () => post('/appointments/999/cancel', {})],
  ['staff dashboard', () => app.request('/staff')],
  ['staff dashboard (empty)', () => emptyApp.request('/staff')],
  ['add agent', () => app.request('/staff/agents/new')],
  ['add agent (invalid)', () => post('/staff/agents', {})],
  ['edit agent', () => app.request(`/staff/agents/${agent!.id}/edit`)],
  ['add ailment', () => app.request('/staff/ailments/new')],
  ['add ailment (invalid)', () => post('/staff/ailments', { agents: '999' })],
  ['edit ailment', () => app.request(`/staff/ailments/${ailment!.id}/edit`)],
  ['add therapy', () => app.request('/staff/therapies/new')],
  ['add therapy (invalid)', () => post('/staff/therapies', { durationMinutes: '1' })],
  ['edit therapy', () => app.request(`/staff/therapies/${therapy!.id}/edit`)],
  ['staff record not found', () => app.request('/staff/therapies/999/edit')],
  ['unknown page', () => app.request('/this/room/does-not-exist')],
]

describe.each(pages)('%s', (_, load) => {
  let body = ''
  beforeAll(async () => {
    body = await (await load()).text()
  })

  it('renders in the layout', () => {
    expect(body.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(body).toMatch(/<nav aria-label="Main">/)
    expect(body).toMatch(/<main class="site-main">.*<\/main>/s)
  })

  it('has exactly one <h1>', () => {
    expect(body.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('labels every form control', () => {
    const controls = [...body.matchAll(/<(input|select|textarea)\b([^>]*)>/g)]
      .map(([, , attrs]) => attrs!)
      .filter((attrs) => !/type="(hidden|checkbox)"/.test(attrs))
    for (const attrs of controls) {
      const id = attrs.match(/\bid="([^"]+)"/)?.[1]
      expect(id, attrs).toBeDefined()
      expect(body).toContain(`<label for="${id}">`)
    }
    // Checkboxes are labelled by wrapping them.
    expect(body.match(/<input type="checkbox"/g)?.length ?? 0).toBe(body.match(/<label><input type="checkbox"/g)?.length ?? 0)
  })

  it('points aria-describedby only at messages that exist, and marks those fields invalid', () => {
    for (const [tag, id] of body.matchAll(/<[^>]*aria-describedby="([^"]+)"[^>]*>/g)) {
      expect(body).toContain(`id="${id}"`)
      expect(tag).toContain('aria-invalid="true"')
    }
  })

  it('labels every button', () => {
    for (const [, attrs, text] of body.matchAll(/<button([^>]*)>(.*?)<\/button>/gs)) {
      expect(text!.trim() || attrs!.match(/aria-label="[^"]+"/)?.[0]).toBeTruthy()
    }
  })
})

describe('unknown pages', () => {
  it('get a friendly 404 in the layout', async () => {
    const res = await app.request('/this/room/does-not-exist')
    const body = await res.text()

    expect(res.status).toBe(404)
    expect(body).toContain('<h1>Page not found</h1>')
    expect(body).toContain('href="/"')
  })
})

describe('errors', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  afterAll(() => errorSpy.mockRestore())

  it('show a friendly 500 page without leaking the stack trace, and log the error', async () => {
    const brokenDb = openDb(':memory:')
    brokenDb.close()
    const res = await createApp(brokenDb, { now: () => NOW }).request('/agents')
    const body = await res.text()

    expect(res.status).toBe(500)
    expect(body).toContain('<h1>Something went wrong</h1>')
    expect(body).not.toMatch(/database is not open|at .*\.(ts|js):\d+|Error:/)
    expect(errorSpy).toHaveBeenCalled()
  })
})
