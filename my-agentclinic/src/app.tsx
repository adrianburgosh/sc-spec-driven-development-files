import { Hono } from 'hono'
import { HomePage } from './views/HomePage.js'

export const app = new Hono()

app.get('/', (c) => c.html(<HomePage />))
