import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import { openDb } from './db/index.js'
import { seed } from './db/seed.js'
import { HomePage } from './views/HomePage.js'

const seededDb = () => {
  const db = openDb(':memory:')
  seed(db)
  return db
}

const app = createApp(seededDb())

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
