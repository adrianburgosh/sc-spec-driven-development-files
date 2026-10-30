import type { Context } from 'hono'
import type { FormLists, FormValues } from './validation.js'

/** A route or query id, or undefined when it isn't a positive whole number. */
export const parseId = (raw: string | undefined) => (raw && /^\d+$/.test(raw) ? Number(raw) : undefined)

/**
 * The submitted form as plain strings: `values` has the first value of each field, and `lists` every value
 * (for checkbox groups). File uploads are ignored.
 */
export const readForm = async (c: Context): Promise<{ values: FormValues; lists: FormLists }> => {
  const body = await c.req.parseBody({ all: true })
  const values: FormValues = {}
  const lists: FormLists = {}
  for (const [name, raw] of Object.entries(body)) {
    const strings = (Array.isArray(raw) ? raw : [raw]).filter((v): v is string => typeof v === 'string')
    values[name] = strings[0] ?? ''
    lists[name] = strings
  }
  return { values, lists }
}
