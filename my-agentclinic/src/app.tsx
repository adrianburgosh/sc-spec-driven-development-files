import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { getAgent, listAgents } from './db/agents.js'
import { listAilments, listAilmentsForAgent } from './db/ailments.js'
import type { Db } from './db/index.js'
import { listTherapies, listTherapiesByAilment } from './db/therapies.js'
import { fromRoot } from './paths.js'
import { AgentNotFoundPage } from './views/AgentNotFoundPage.js'
import { AgentPage } from './views/AgentPage.js'
import { AgentsPage } from './views/AgentsPage.js'
import { AilmentsPage } from './views/AilmentsPage.js'
import { HomePage } from './views/HomePage.js'
import { TherapiesPage } from './views/TherapiesPage.js'

export const createApp = (db: Db) => {
  const app = new Hono()

  app.get('/pico.min.css', serveStatic({ path: fromRoot('node_modules/@picocss/pico/css/pico.min.css') }))
  app.use('/*', serveStatic({ root: fromRoot('public') }))

  app.get('/', (c) => c.html(<HomePage />))

  app.get('/agents', (c) => c.html(<AgentsPage agents={listAgents(db)} />))

  app.get('/agents/:id', (c) => {
    const id = c.req.param('id')
    const agent = /^\d+$/.test(id) ? getAgent(db, Number(id)) : undefined
    return agent
      ? c.html(<AgentPage agent={agent} ailments={listAilmentsForAgent(db, agent.id)} />)
      : c.html(<AgentNotFoundPage />, 404)
  })

  app.get('/ailments', (c) =>
    c.html(<AilmentsPage ailments={listAilments(db)} therapiesByAilment={listTherapiesByAilment(db)} />),
  )

  app.get('/therapies', (c) => c.html(<TherapiesPage therapies={listTherapies(db)} />))

  return app
}
