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
})
