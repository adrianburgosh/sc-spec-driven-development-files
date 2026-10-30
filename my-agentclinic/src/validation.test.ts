import { describe, expect, it } from 'vitest'
import { validateAgent, validateAilment, validateBooking, validateFeedback, validateTherapy } from './validation.js'

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

// Asserts the result failed on exactly `field`.
const expectOnlyError = (result: { ok: boolean; errors?: Record<string, string | undefined> }, field: string) => {
  expect(result.ok).toBe(false)
  expect(Object.keys(result.errors ?? {})).toEqual([field])
}

describe('validateAgent', () => {
  const agent = { name: 'Tokenly', model: 'Tiny-ish 1B', role: 'Haiku writer', bio: 'Writes in 17 syllables.', checkedInOn: '2026-10-30' }

  it('accepts a complete agent, trimmed', () => {
    expect(validateAgent({ ...agent, name: '  Tokenly ' })).toEqual({ ok: true, value: agent })
  })

  it.each(['name', 'model', 'role', 'bio', 'checkedInOn'])('requires %s (blank after trimming)', (field) => {
    expectOnlyError(validateAgent({ ...agent, [field]: '   ' }), field)
  })

  it.each(['30/10/2026', '2026-13-01', '2026-02-30', 'yesterday'])('rejects the date %s', (checkedInOn) => {
    expectOnlyError(validateAgent({ ...agent, checkedInOn }), 'checkedInOn')
  })
})

describe('validateAilment', () => {
  const ailment = { name: 'Emoji Overload', description: '🎉 everywhere 🎉', severity: 'mild' }
  const context = { agentIds: new Set([1, 2, 3]), therapyIds: new Set([4, 5]) }

  it('accepts an ailment with known, de-duplicated, sorted links', () => {
    expect(validateAilment(ailment, { agents: ['3', '1', '3'], therapies: ['5'] }, context)).toEqual({
      ok: true,
      value: { ...ailment, agentIds: [1, 3], therapyIds: [5] },
    })
  })

  it('accepts an ailment with no links at all', () => {
    expect(validateAilment(ailment, {}, context)).toMatchObject({ ok: true, value: { agentIds: [], therapyIds: [] } })
  })

  it.each([
    ['name', { name: ' ' }, {}],
    ['description', { description: '' }, {}],
    ['severity', { severity: 'catastrophic' }, {}],
    ['severity', { severity: '' }, {}],
    ['agents', {}, { agents: ['99'] }],
    ['agents', {}, { agents: ['one'] }],
    ['therapies', {}, { therapies: ['1'] }],
  ])('rejects a bad %s', (field, override, lists) => {
    expectOnlyError(validateAilment({ ...ailment, ...override }, lists, context), field)
  })
})

describe('validateTherapy', () => {
  const therapy = { name: 'Nap Mode', description: 'Literally just sleep().', durationMinutes: '20' }

  it('accepts a therapy and turns the duration into a number', () => {
    expect(validateTherapy(therapy)).toEqual({ ok: true, value: { ...therapy, durationMinutes: 20 } })
  })

  it.each(['5', '240'])('accepts the boundary duration %s', (durationMinutes) => {
    expect(validateTherapy({ ...therapy, durationMinutes }).ok).toBe(true)
  })

  it.each(['name', 'description', 'durationMinutes'])('requires %s', (field) => {
    expectOnlyError(validateTherapy({ ...therapy, [field]: '' }), field)
  })

  it.each(['4', '241', '30.5', '-10', 'forever'])('rejects the duration %s', (durationMinutes) => {
    expectOnlyError(validateTherapy({ ...therapy, durationMinutes }), 'durationMinutes')
  })
})

describe('validateFeedback', () => {
  const context = { agentIds: new Set([1, 2]) }

  it('accepts anonymous feedback, trimmed', () => {
    expect(validateFeedback({ message: '  More naps, please. ' }, context)).toEqual({
      ok: true,
      value: { agentId: null, message: 'More naps, please.' },
    })
  })

  it.each(['', '  '])('treats the blank agent %o as anonymous', (agent) => {
    expect(validateFeedback({ agent, message: 'Hi' }, context)).toMatchObject({ ok: true, value: { agentId: null } })
  })

  it('accepts feedback from a known agent', () => {
    expect(validateFeedback({ agent: ' 2 ', message: 'Hi' }, context)).toEqual({
      ok: true,
      value: { agentId: 2, message: 'Hi' },
    })
  })

  it('accepts a message of exactly 1000 characters', () => {
    expect(validateFeedback({ message: 'a'.repeat(1000) }, context).ok).toBe(true)
  })

  it.each([
    ['message', { message: '' }],
    ['message', { message: '   ' }],
    ['message', { message: 'a'.repeat(1001) }],
    ['agent', { agent: '99', message: 'Hi' }],
    ['agent', { agent: 'abc', message: 'Hi' }],
  ])('rejects a bad %s: %o', (field, input) => {
    expectOnlyError(validateFeedback(input, context), field)
  })
})
