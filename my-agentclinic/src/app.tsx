import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { HomePage } from './views/HomePage.js'

export const app = new Hono()

app.use('/*', serveStatic({ root: './public' }))

app.get('/', (c) => c.html(<HomePage />))
