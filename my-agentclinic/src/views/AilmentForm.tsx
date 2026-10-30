import type { Agent, Therapy } from '../types.js'
import { SEVERITIES, type FormErrors, type FormLists, type FormValues } from '../validation.js'
import { controlProps, Field, FieldError, FormError } from './Field.js'
import { Layout } from './Layout.js'

type AilmentFormProps = {
  /** The ailment being edited, or undefined to add a new one. */
  id?: number
  values: FormValues
  /** The checked agent and therapy ids, as strings. */
  lists: FormLists
  errors: FormErrors
  agents: Agent[]
  therapies: Therapy[]
}

type CheckboxGroupProps = {
  name: string
  legend: string
  options: { id: number; name: string }[]
  checked: string[]
  error?: string
  empty: string
}

const CheckboxGroup = ({ name, legend, options, checked, error, empty }: CheckboxGroupProps) => (
  <fieldset
    class="checkbox-group"
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={error ? `${name}-error` : undefined}
  >
    <legend>{legend}</legend>
    {options.length === 0 ? (
      <p class="empty-state">{empty}</p>
    ) : (
      options.map((option) => (
        <label>
          <input type="checkbox" name={name} value={String(option.id)} checked={checked.includes(String(option.id))} />
          {option.name}
        </label>
      ))
    )}
    <FieldError name={name} error={error} />
  </fieldset>
)

export const AilmentForm = ({ id, values, lists, errors, agents, therapies }: AilmentFormProps) => {
  const heading = id === undefined ? 'Add an ailment' : `Edit ${values.name || 'ailment'}`
  return (
    <Layout title={`${heading} · AgentClinic`} current="/staff">
      <h1>{heading}</h1>
      <FormError errors={errors} />
      <form method="post" action={id === undefined ? '/staff/ailments' : `/staff/ailments/${id}`} class="stacked-form">
        <Field name="name" label="Name" error={errors.name}>
          <input type="text" {...controlProps('name', errors.name)} value={values.name} required />
        </Field>
        <Field name="description" label="Description" error={errors.description}>
          <textarea {...controlProps('description', errors.description)} rows={3} required>
            {values.description}
          </textarea>
        </Field>
        <Field name="severity" label="Severity" error={errors.severity}>
          <select {...controlProps('severity', errors.severity)} required>
            <option value="">Choose a severity…</option>
            {SEVERITIES.map((severity) => (
              <option value={severity} selected={severity === values.severity}>
                {severity}
              </option>
            ))}
          </select>
        </Field>
        <CheckboxGroup
          name="agents"
          legend="Agents with this ailment"
          options={agents}
          checked={lists.agents ?? []}
          error={errors.agents}
          empty="No agents yet."
        />
        <CheckboxGroup
          name="therapies"
          legend="Therapies that treat it"
          options={therapies}
          checked={lists.therapies ?? []}
          error={errors.therapies}
          empty="No therapies yet."
        />
        <button type="submit">{id === undefined ? 'Add ailment' : 'Save changes'}</button>
      </form>
      <p>
        <a href="/staff">← Back to the staff dashboard</a>
      </p>
    </Layout>
  )
}
