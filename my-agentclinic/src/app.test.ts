import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import { listAgents } from './db/agents.js'
import { listAilments } from './db/ailments.js'
import { openDb } from './db/index.js'
import { seed } from './db/seed.js'
import { HomePage } from './views/HomePage.js'

const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const db = openDb(':memory:')
seed(db)
const app = createApp(db)

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
    const [agent] = listAgents(db)
    const res = await app.request(`/agents/${agent!.id}`)
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).toContain(`<h1>${agent!.name}</h1>`)
    expect(body).toContain(agent!.model)
    expect(body).toContain(agent!.role)
    expect(body).toContain(escapeHtml(agent!.bio))
    expect(body).toContain(`datetime="${agent!.checkedInOn}"`)
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

  it('shows an empty state when there are no ailments', async () => {
    const body = await (await createApp(openDb(':memory:')).request('/ailments')).text()

    expect(body).toContain('class="empty-state"')
  })
})

describe('GET /styles.css', () => {
  it('serves the stylesheet', async () => {
    const res = await app.request('/styles.css')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/css')
  })
})

describe('GET /pico.min.css', () => {
  it('serves Pico CSS', async () => {
    const res = await app.request('/pico.min.css')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/css')
  })
})
