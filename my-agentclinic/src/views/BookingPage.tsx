import { formatDay, formatTime } from '../slots.js'
import type { Agent, Therapy } from '../types.js'
import type { FormErrors, FormValues } from '../validation.js'
import { controlProps, Field, FormError } from './Field.js'
import { Layout } from './Layout.js'

type BookingPageProps = {
  agents: Agent[]
  therapies: Therapy[]
  freeSlots: string[]
  values: FormValues
  errors: FormErrors
}

const groupByDay = (slots: string[]) => {
  const days = new Map<string, string[]>()
  for (const slot of slots) days.set(slot.slice(0, 10), [...(days.get(slot.slice(0, 10)) ?? []), slot])
  return [...days]
}

export const BookingPage = ({ agents, therapies, freeSlots, values, errors }: BookingPageProps) => (
  <Layout title="Book an appointment · AgentClinic" current="/appointments">
    <h1>Book an appointment</h1>
    <p>Pick a therapy and a time. We'll keep the kettle warm and the context window clear.</p>
    <FormError errors={errors} />
    <form method="post" action="/appointments" class="stacked-form">
      <Field name="agent" label="Agent" error={errors.agent}>
        <select {...controlProps('agent', errors.agent)} required>
          <option value="">Choose an agent…</option>
          {agents.map((agent) => (
            <option value={String(agent.id)} selected={String(agent.id) === values.agent}>
              {agent.name}
            </option>
          ))}
        </select>
      </Field>
      <Field name="therapy" label="Therapy" error={errors.therapy}>
        <select {...controlProps('therapy', errors.therapy)} required>
          <option value="">Choose a therapy…</option>
          {therapies.map((therapy) => (
            <option value={String(therapy.id)} selected={String(therapy.id) === values.therapy}>
              {therapy.name} ({therapy.durationMinutes} min)
            </option>
          ))}
        </select>
      </Field>
      <Field name="slot" label="Time slot" error={errors.slot}>
        {freeSlots.length === 0 ? (
          <p class="empty-state">Every slot for the next two weeks is taken. Popular place, this clinic.</p>
        ) : (
          <select {...controlProps('slot', errors.slot)} required>
            <option value="">Choose a time…</option>
            {groupByDay(freeSlots).map(([day, slots]) => (
              <optgroup label={formatDay(day)}>
                {slots.map((slot) => (
                  <option value={slot} selected={slot === values.slot}>
                    {formatDay(slot)} · {formatTime(slot)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </Field>
      <button type="submit">Book it</button>
    </form>
    <p>
      <a href="/appointments">← Back to appointments</a>
    </p>
  </Layout>
)
