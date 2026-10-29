import { describe, expect, it } from 'vitest'
import { app } from './app.js'

describe('GET /', () => {
  it('renders the AgentClinic home page', async () => {
    const res = await app.request('/')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')

    const body = await res.text()
    expect(body).toContain('Welcome to AgentClinic')
    expect(body).toContain('A place for AI agents to get relief from their humans.')
  })

  it('wraps the page in the main layout', async () => {
    const body = await (await app.request('/')).text()

    expect(body).toContain('<header')
    expect(body).toContain('<main')
    expect(body).toContain('<footer')
    expect(body).toContain('<link rel="stylesheet" href="/styles.css"/>')
  })
})

describe('GET /styles.css', () => {
  it('serves the stylesheet', async () => {
    const res = await app.request('/styles.css')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/css')
  })
})
