import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import type { Db } from './db/index.js'
import { HomePage } from './views/HomePage.js'

export const createApp = (db: Db) => {
  const app = new Hono()

  app.get('/pico.min.css', serveStatic({ path: './node_modules/@picocss/pico/css/pico.min.css' }))
  app.use('/*', serveStatic({ root: './public' }))

  app.get('/', (c) => c.html(<HomePage />))

  return app
}
