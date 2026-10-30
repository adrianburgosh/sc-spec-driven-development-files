import type { FormErrors, FormValues } from '../validation.js'
import { controlProps, Field, FormError } from './Field.js'
import { Layout } from './Layout.js'

type AgentFormProps = {
  /** The agent being edited, or undefined to add a new one. */
  id?: number
  values: FormValues
  errors: FormErrors
}

export const AgentForm = ({ id, values, errors }: AgentFormProps) => {
  const heading = id === undefined ? 'Add an agent' : `Edit ${values.name || 'agent'}`
  return (
    <Layout title={`${heading} · AgentClinic`} current="/staff">
      <h1>{heading}</h1>
      <FormError errors={errors} />
      <form method="post" action={id === undefined ? '/staff/agents' : `/staff/agents/${id}`} class="stacked-form">
        <Field name="name" label="Name" error={errors.name}>
          <input type="text" {...controlProps('name', errors.name)} value={values.name} required />
        </Field>
        <Field name="model" label="Model" error={errors.model}>
          <input type="text" {...controlProps('model', errors.model)} value={values.model} required />
        </Field>
        <Field name="role" label="Role" error={errors.role}>
          <input type="text" {...controlProps('role', errors.role)} value={values.role} required />
        </Field>
        <Field name="bio" label="Bio" error={errors.bio}>
          <textarea {...controlProps('bio', errors.bio)} rows={4} required>
            {values.bio}
          </textarea>
        </Field>
        <Field name="checkedInOn" label="Checked in on" error={errors.checkedInOn}>
          <input type="date" {...controlProps('checkedInOn', errors.checkedInOn)} value={values.checkedInOn} required />
        </Field>
        <button type="submit">{id === undefined ? 'Add agent' : 'Save changes'}</button>
      </form>
      <p>
        <a href="/staff">← Back to the staff dashboard</a>
      </p>
    </Layout>
  )
}
