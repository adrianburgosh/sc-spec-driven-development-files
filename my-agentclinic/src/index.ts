import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { openDb } from './db/index.js'

const port = Number(process.env.PORT ?? 3000)
const app = createApp(openDb())

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`AgentClinic is open at http://localhost:${info.port}`)
})
