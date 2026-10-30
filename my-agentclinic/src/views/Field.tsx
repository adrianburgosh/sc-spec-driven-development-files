import type { Child } from 'hono/jsx'

/** The attributes that tie a form control to its label and its error message. */
export const controlProps = (name: string, error?: string) => ({
  id: name,
  name,
  'aria-invalid': error ? ('true' as const) : undefined,
  'aria-describedby': error ? `${name}-error` : undefined,
})

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
    {error && (
      <small id={`${name}-error`} class="field-error">
        {error}
      </small>
    )}
  </div>
)

type FormErrorProps = {
  error?: string
}

/** A message about the whole form, announced when the page loads. */
export const FormError = ({ error }: FormErrorProps) =>
  error ? (
    <p role="alert" class="form-error">
      {error}
    </p>
  ) : null
