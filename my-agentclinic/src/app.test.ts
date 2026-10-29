import { describe, expect, it } from 'vitest'
import { app } from './app.js'
import { HomePage } from './views/HomePage.js'

describe('GET /', () => {
  it('responds with an HTML page', async () => {
    const res = await app.request('/')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('renders a valid HTML document', async () => {
    const body = await (await app.request('/')).text()

    expect(body.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(body).toContain('<html lang="en">')
    expect(body).toContain('<meta charset="utf-8"/>')
    expect(body).toContain('<meta name="viewport"')
    expect(body).toContain('<title>AgentClinic</title>')
    expect(body).toContain('<link rel="stylesheet" href="/styles.css"/>')
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
