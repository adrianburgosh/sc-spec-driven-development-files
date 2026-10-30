// Staff pages: the dashboard and the add/edit forms for agents, ailments and therapies.
import { Hono } from 'hono'
import type { Context } from 'hono'
import { createAgent, getAgent, listAgents, updateAgent } from './db/agents.js'
import { listAppointmentsOn } from './db/appointments.js'
import {
  createAilment,
  getAilment,
  getAilmentLinks,
  listAilments,
  setAilmentLinks,
  updateAilment,
} from './db/ailments.js'
import { clinicCounts } from './db/clinic.js'
import { transaction, type Db } from './db/index.js'
import { createTherapy, getTherapy, listTherapies, updateTherapy } from './db/therapies.js'
import { parseId, readForm } from './http.js'
import { toDay } from './slots.js'
import type { Agent, Ailment, Therapy } from './types.js'
import {
  validateAgent,
  validateAilment,
  validateTherapy,
  type FormErrors,
  type FormLists,
  type FormValues,
} from './validation.js'
import { AgentForm } from './views/AgentForm.js'
import { AilmentForm } from './views/AilmentForm.js'
import { NotFoundPage } from './views/NotFoundPage.js'
import { StaffDashboardPage } from './views/StaffDashboardPage.js'
import { TherapyForm } from './views/TherapyForm.js'

const agentValues = (a: Agent): FormValues => ({
  name: a.name,
  model: a.model,
  role: a.role,
  bio: a.bio,
  checkedInOn: a.checkedInOn,
})

const ailmentValues = (a: Ailment): FormValues => ({ name: a.name, description: a.description, severity: a.severity })

const therapyValues = (t: Therapy): FormValues => ({
  name: t.name,
  description: t.description,
  durationMinutes: String(t.durationMinutes),
})

const notFound = (c: Context, thing: string) =>
  c.html(<NotFoundPage thing={thing} backHref="/staff" backLabel="the staff dashboard" />, 404)

export const staffRoutes = (db: Db, now: () => Date) => {
  const staff = new Hono()

  staff.get('/', (c) => {
    const today = toDay(now())
    return c.html(
      <StaffDashboardPage
        today={today}
        todaysAppointments={listAppointmentsOn(db, today)}
        counts={clinicCounts(db, now())}
        agents={listAgents(db)}
        ailments={listAilments(db)}
        therapies={listTherapies(db)}
      />,
    )
  })

  // Agents

  const agentForm = (c: Context, id: number | undefined, values: FormValues, errors: FormErrors = {}) =>
    c.html(<AgentForm id={id} values={values} errors={errors} />, Object.keys(errors).length > 0 ? 400 : 200)

  staff.get('/agents/new', (c) => agentForm(c, undefined, { checkedInOn: toDay(now()) }))

  staff.post('/agents', async (c) => {
    const { values } = await readForm(c)
    const result = validateAgent(values)
    if (!result.ok) return agentForm(c, undefined, values, result.errors)
    return c.redirect(`/agents/${createAgent(db, result.value)}`, 303)
  })

  staff.get('/agents/:id/edit', (c) => {
    const id = parseId(c.req.param('id'))
    const agent = id === undefined ? undefined : getAgent(db, id)
    return agent ? agentForm(c, agent.id, agentValues(agent)) : notFound(c, 'Agent')
  })

  staff.post('/agents/:id', async (c) => {
    const id = parseId(c.req.param('id'))
    if (id === undefined || !getAgent(db, id)) return notFound(c, 'Agent')
    const { values } = await readForm(c)
    const result = validateAgent(values)
    if (!result.ok) return agentForm(c, id, values, result.errors)
    updateAgent(db, id, result.value)
    return c.redirect(`/agents/${id}`, 303)
  })

  // Ailments

  const ailmentForm = (
    c: Context,
    id: number | undefined,
    values: FormValues,
    lists: FormLists,
    errors: FormErrors = {},
  ) =>
    c.html(
      <AilmentForm
        id={id}
        values={values}
        lists={lists}
        errors={errors}
        agents={listAgents(db)}
        therapies={listTherapies(db)}
      />,
      Object.keys(errors).length > 0 ? 400 : 200,
    )

  const validateAilmentForm = (values: FormValues, lists: FormLists) =>
    validateAilment(values, lists, {
      agentIds: new Set(listAgents(db).map((a) => a.id)),
      therapyIds: new Set(listTherapies(db).map((t) => t.id)),
    })

  staff.get('/ailments/new', (c) => ailmentForm(c, undefined, {}, {}))

  staff.post('/ailments', async (c) => {
    const { values, lists } = await readForm(c)
    const result = validateAilmentForm(values, lists)
    if (!result.ok) return ailmentForm(c, undefined, values, lists, result.errors)
    const { agentIds, therapyIds, ...ailment } = result.value
    transaction(db, () => setAilmentLinks(db, createAilment(db, ailment), { agentIds, therapyIds }))
    return c.redirect('/ailments', 303)
  })

  staff.get('/ailments/:id/edit', (c) => {
    const id = parseId(c.req.param('id'))
    const ailment = id === undefined ? undefined : getAilment(db, id)
    if (!ailment) return notFound(c, 'Ailment')
    const links = getAilmentLinks(db, ailment.id)
    return ailmentForm(c, ailment.id, ailmentValues(ailment), {
      agents: links.agentIds.map(String),
      therapies: links.therapyIds.map(String),
    })
  })

  staff.post('/ailments/:id', async (c) => {
    const id = parseId(c.req.param('id'))
    if (id === undefined || !getAilment(db, id)) return notFound(c, 'Ailment')
    const { values, lists } = await readForm(c)
    const result = validateAilmentForm(values, lists)
    if (!result.ok) return ailmentForm(c, id, values, lists, result.errors)
    const { agentIds, therapyIds, ...ailment } = result.value
    transaction(db, () => {
      updateAilment(db, id, ailment)
      setAilmentLinks(db, id, { agentIds, therapyIds })
    })
    return c.redirect('/ailments', 303)
  })

  // Therapies

  const therapyForm = (c: Context, id: number | undefined, values: FormValues, errors: FormErrors = {}) =>
    c.html(<TherapyForm id={id} values={values} errors={errors} />, Object.keys(errors).length > 0 ? 400 : 200)

  staff.get('/therapies/new', (c) => therapyForm(c, undefined, {}))

  staff.post('/therapies', async (c) => {
    const { values } = await readForm(c)
    const result = validateTherapy(values)
    if (!result.ok) return therapyForm(c, undefined, values, result.errors)
    createTherapy(db, result.value)
    return c.redirect('/therapies', 303)
  })

  staff.get('/therapies/:id/edit', (c) => {
    const id = parseId(c.req.param('id'))
    const therapy = id === undefined ? undefined : getTherapy(db, id)
    return therapy ? therapyForm(c, therapy.id, therapyValues(therapy)) : notFound(c, 'Therapy')
  })

  staff.post('/therapies/:id', async (c) => {
    const id = parseId(c.req.param('id'))
    if (id === undefined || !getTherapy(db, id)) return notFound(c, 'Therapy')
    const { values } = await readForm(c)
    const result = validateTherapy(values)
    if (!result.ok) return therapyForm(c, id, values, result.errors)
    updateTherapy(db, id, result.value)
    return c.redirect('/therapies', 303)
  })

  return staff
}
