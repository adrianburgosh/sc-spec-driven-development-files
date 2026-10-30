import type { Child } from 'hono/jsx'
import type { FormErrors } from '../validation.js'

/** The attributes that tie a form control to its label and its error message. */
export const controlProps = (name: string, error?: string) => ({
  id: name,
  name,
  'aria-invalid': error ? ('true' as const) : undefined,
  'aria-describedby': error ? `${name}-error` : undefined,
})

type FieldErrorProps = {
  name: string
  error?: string
}

export const FieldError = ({ name, error }: FieldErrorProps) =>
  error ? (
    <small id={`${name}-error`} class="field-error">
      {error}
    </small>
  ) : null

type FieldProps = {
  name: string
  label: string
  error?: string
  /** The control itself, spread with `controlProps(name, error)`. */
  children: Child
}

export const Field = ({ name, label, error, children }: FieldProps) => (
  <div class="field">
    <label for={name}>{label}</label>
    {children}
    <FieldError name={name} error={error} />
  </div>
)

type FormErrorProps = {
  errors: FormErrors
}

/** A summary above the form, announced when the page loads: the `form` error, or a nudge to fix the fields. */
export const FormError = ({ errors }: FormErrorProps) => {
  const message =
    errors.form ?? (Object.keys(errors).length > 0 ? 'Almost there! Please fix the highlighted fields.' : undefined)
  return message ? (
    <p role="alert" class="form-error">
      {message}
    </p>
  ) : null
}
