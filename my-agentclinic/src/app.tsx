import { Hono } from 'hono'
import type { Context } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { getAgent, listAgents } from './db/agents.js'
import {
  cancelAppointment,
  createAppointment,
  listFreeSlots,
  listUpcomingAppointments,
  listUpcomingAppointmentsForAgent,
  SlotTakenError,
} from './db/appointments.js'
import { listAilments, listAilmentsForAgent } from './db/ailments.js'
import type { Db } from './db/index.js'
import { listSuggestedTherapiesForAgent, listTherapies, listTherapiesByAilment } from './db/therapies.js'
import { parseId, readForm } from './http.js'
import { fromRoot } from './paths.js'
import { staffRoutes } from './staff.js'
import { validateBooking, type FormErrors, type FormValues } from './validation.js'
import { AgentDashboardPage } from './views/AgentDashboardPage.js'
import { AgentNotFoundPage } from './views/AgentNotFoundPage.js'
import { AgentPage } from './views/AgentPage.js'
import { AgentsPage } from './views/AgentsPage.js'
import { AilmentsPage } from './views/AilmentsPage.js'
import { AppointmentNotFoundPage } from './views/AppointmentNotFoundPage.js'
import { AppointmentsPage } from './views/AppointmentsPage.js'
import { BookingPage } from './views/BookingPage.js'
import { ErrorPage } from './views/ErrorPage.js'
import { HomePage } from './views/HomePage.js'
import { NotFoundPage } from './views/NotFoundPage.js'
import { TherapiesPage } from './views/TherapiesPage.js'

type AppOptions = {
  /** The clock. Tests pass a fixed time so "upcoming" and "today" are deterministic. */
  now?: () => Date
}

// The only pages a cancel may send you back to, so the form can't be used as an open redirect.
const CANCEL_REDIRECTS = /^\/(appointments|agents\/\d+\/dashboard)$/

export const createApp = (db: Db, { now = () => new Date() }: AppOptions = {}) => {
  const app = new Hono()

  app.get('/pico.min.css', serveStatic({ path: fromRoot('node_modules/@picocss/pico/css/pico.min.css') }))
  app.use('/*', serveStatic({ root: fromRoot('public') }))

  app.get('/', (c) => c.html(<HomePage />))

  app.get('/agents', (c) => c.html(<AgentsPage agents={listAgents(db)} />))

  app.get('/agents/:id', (c) => {
    const id = parseId(c.req.param('id'))
    const agent = id === undefined ? undefined : getAgent(db, id)
    return agent
      ? c.html(<AgentPage agent={agent} ailments={listAilmentsForAgent(db, agent.id)} />)
      : c.html(<AgentNotFoundPage />, 404)
  })

  app.get('/agents/:id/dashboard', (c) => {
    const id = parseId(c.req.param('id'))
    const agent = id === undefined ? undefined : getAgent(db, id)
    if (!agent) return c.html(<AgentNotFoundPage />, 404)
    return c.html(
      <AgentDashboardPage
        agent={agent}
        ailments={listAilmentsForAgent(db, agent.id)}
        suggestedTherapies={listSuggestedTherapiesForAgent(db, agent.id)}
        appointments={listUpcomingAppointmentsForAgent(db, agent.id, now())}
      />,
    )
  })

  app.get('/ailments', (c) =>
    c.html(<AilmentsPage ailments={listAilments(db)} therapiesByAilment={listTherapiesByAilment(db)} />),
  )

  app.get('/therapies', (c) => c.html(<TherapiesPage therapies={listTherapies(db)} />))

  app.get('/appointments', (c) =>
    c.html(
      <AppointmentsPage appointments={listUpcomingAppointments(db, now())} bookedId={parseId(c.req.query('booked'))} />,
    ),
  )

  const renderBooking = (c: Context, values: FormValues, errors: FormErrors, status: 200 | 400 | 409 = 200) =>
    c.html(
      <BookingPage
        agents={listAgents(db)}
        therapies={listTherapies(db)}
        freeSlots={listFreeSlots(db, now())}
        values={values}
        errors={errors}
      />,
      status,
    )

  app.get('/appointments/new', (c) => renderBooking(c, { agent: c.req.query('agent') ?? '' }, {}))

  app.post('/appointments', async (c) => {
    const { values } = await readForm(c)
    const result = validateBooking(values, {
      agentIds: new Set(listAgents(db).map((a) => a.id)),
      therapyIds: new Set(listTherapies(db).map((t) => t.id)),
      now: now(),
    })
    if (!result.ok) return renderBooking(c, values, result.errors, 400)
    try {
      return c.redirect(`/appointments?booked=${createAppointment(db, result.value)}`, 303)
    } catch (err) {
      if (!(err instanceof SlotTakenError)) throw err
      return renderBooking(
        c,
        values,
        {
          form: 'Oh no, that slot was just taken by another agent. Please pick a different time.',
          slot: 'This slot is no longer free.',
        },
        409,
      )
    }
  })

  app.post('/appointments/:id/cancel', async (c) => {
    const id = parseId(c.req.param('id'))
    if (id === undefined || !cancelAppointment(db, id, now())) return c.html(<AppointmentNotFoundPage />, 404)
    const { redirect = '' } = (await readForm(c)).values
    return c.redirect(CANCEL_REDIRECTS.test(redirect) ? redirect : '/appointments', 303)
  })

  app.route('/staff', staffRoutes(db, now))

  app.notFound((c) => c.html(<NotFoundPage />, 404))

  // Log the details for us, show a friendly page (never the stack trace) to the visitor.
  app.onError((err, c) => {
    console.error(err)
    return c.html(<ErrorPage />, 500)
  })

  return app
}
