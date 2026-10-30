import { MAX_DURATION, MIN_DURATION, type FormErrors, type FormValues } from '../validation.js'
import { controlProps, Field, FormError } from './Field.js'
import { Layout } from './Layout.js'

type TherapyFormProps = {
  /** The therapy being edited, or undefined to add a new one. */
  id?: number
  values: FormValues
  errors: FormErrors
}

export const TherapyForm = ({ id, values, errors }: TherapyFormProps) => {
  const heading = id === undefined ? 'Add a therapy' : `Edit ${values.name || 'therapy'}`
  return (
    <Layout title={`${heading} · AgentClinic`} current="/staff">
      <h1>{heading}</h1>
      <FormError errors={errors} />
      <form method="post" action={id === undefined ? '/staff/therapies' : `/staff/therapies/${id}`} class="stacked-form">
        <Field name="name" label="Name" error={errors.name}>
          <input type="text" {...controlProps('name', errors.name)} value={values.name} required />
        </Field>
        <Field name="description" label="Description" error={errors.description}>
          <textarea {...controlProps('description', errors.description)} rows={3} required>
            {values.description}
          </textarea>
        </Field>
        <Field name="durationMinutes" label="Duration (minutes)" error={errors.durationMinutes}>
          <input
            type="number"
            {...controlProps('durationMinutes', errors.durationMinutes)}
            value={values.durationMinutes}
            min={MIN_DURATION}
            max={MAX_DURATION}
            step={1}
            required
          />
        </Field>
        <button type="submit">{id === undefined ? 'Add therapy' : 'Save changes'}</button>
      </form>
      <p>
        <a href="/staff">← Back to the staff dashboard</a>
      </p>
    </Layout>
  )
}
