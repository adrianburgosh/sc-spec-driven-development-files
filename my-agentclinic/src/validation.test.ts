import { describe, expect, it } from 'vitest'
import { validateBooking } from './validation.js'

// Local time, so the tests pass in any time zone. 2026-11-02 is a Monday.
const now = new Date(2026, 10, 2, 10, 30)
const context = { agentIds: new Set([1, 2]), therapyIds: new Set([7]), now }
const valid = { agent: '2', therapy: '7', slot: '2026-11-02T11:00' }

describe('validateBooking', () => {
  it('accepts a known agent, a known therapy and a free future slot', () => {
    expect(validateBooking(valid, context)).toEqual({
      ok: true,
      value: { agentId: 2, therapyId: 7, slot: '2026-11-02T11:00' },
    })
  })

  it('trims the submitted values', () => {
    expect(validateBooking({ agent: ' 2 ', therapy: '7 ', slot: ' 2026-11-02T11:00' }, context)).toMatchObject({
      ok: true,
      value: { agentId: 2, therapyId: 7, slot: '2026-11-02T11:00' },
    })
  })

  it('reports every missing field at once', () => {
    const result = validateBooking({}, context)

    expect(result.ok).toBe(false)
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['agent', 'slot', 'therapy'])
  })

  it.each([
    ['agent', { agent: '' }, 'Choose which agent'],
    ['agent', { agent: '99' }, "couldn't find that agent"],
    ['agent', { agent: 'abc' }, "couldn't find that agent"],
    ['therapy', { therapy: '' }, 'Choose a therapy'],
    ['therapy', { therapy: '8' }, "don't offer that therapy"],
    ['slot', { slot: '' }, 'Pick a time slot'],
    ['slot', { slot: '2026-11-02T11:30' }, 'opening hours'],
    ['slot', { slot: '2026-11-07T11:00' }, 'opening hours'],
    ['slot', { slot: 'soon' }, 'opening hours'],
    ['slot', { slot: '2026-11-02T10:00' }, 'already passed'],
    ['slot', { slot: '2026-10-30T10:00' }, 'already passed'],
    ['slot', { slot: '2026-11-20T10:00' }, 'two weeks ahead'],
  ])('rejects a bad %s: %o', (field, override, message) => {
    const result = validateBooking({ ...valid, ...override }, context)

    expect(result.ok).toBe(false)
    expect(!result.ok && Object.keys(result.errors)).toEqual([field])
    expect(!result.ok && result.errors[field]).toContain(message)
  })
})
