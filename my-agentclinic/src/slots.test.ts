import { describe, expect, it } from 'vitest'
import { formatSlot, isValidSlot, nowKey, toDay, toSlot, upcomingSlots } from './slots.js'

// Local times, so the tests pass in any time zone. 2026-11-02 is a Monday.
const monday8am = new Date(2026, 10, 2, 8, 0)

describe('toSlot / toDay / nowKey', () => {
  it('formats local dates', () => {
    const date = new Date(2026, 10, 2, 9, 45)

    expect(toDay(date)).toBe('2026-11-02')
    expect(toSlot(date)).toBe('2026-11-02T09:00')
    expect(nowKey(date)).toBe('2026-11-02T09:45')
  })
})

describe('upcomingSlots', () => {
  const slots = upcomingSlots(monday8am)

  it('offers every hour from 09:00 to 16:00', () => {
    expect(slots.filter((s) => s.startsWith('2026-11-02'))).toEqual(
      [9, 10, 11, 12, 13, 14, 15, 16].map((h) => `2026-11-02T${String(h).padStart(2, '0')}:00`),
    )
  })

  it('skips weekends', () => {
    expect(slots.some((s) => s.startsWith('2026-11-07') || s.startsWith('2026-11-08'))).toBe(false)
  })

  it('covers 14 days (10 weekdays) and nothing beyond', () => {
    expect(slots).toHaveLength(10 * 8)
    expect(slots.at(-1)).toBe('2026-11-13T16:00')
  })

  it('leaves out slots at or before now', () => {
    const later = upcomingSlots(new Date(2026, 10, 2, 11, 0))

    expect(later[0]).toBe('2026-11-02T12:00')
    expect(upcomingSlots(new Date(2026, 10, 2, 11, 30))[0]).toBe('2026-11-02T12:00')
  })

  it('starts on Monday when asked on a Saturday', () => {
    expect(upcomingSlots(new Date(2026, 10, 7, 10, 0))[0]).toBe('2026-11-09T09:00')
  })

  it('returns only valid slots, in order', () => {
    expect(slots.every(isValidSlot)).toBe(true)
    expect([...slots].sort()).toEqual(slots)
  })
})

describe('isValidSlot', () => {
  it.each(['2026-11-02T09:00', '2026-11-06T16:00', '2020-01-01T10:00'])('accepts %s', (slot) => {
    expect(isValidSlot(slot)).toBe(true)
  })

  it.each([
    ['too early', '2026-11-02T08:00'],
    ['too late', '2026-11-02T17:00'],
    ['off the hour', '2026-11-02T09:30'],
    ['a Saturday', '2026-11-07T10:00'],
    ['a Sunday', '2026-11-08T10:00'],
    ['an impossible date', '2026-02-30T10:00'],
    ['garbage', 'tomorrow-ish'],
    ['empty', ''],
  ])('rejects %s', (_, slot) => {
    expect(isValidSlot(slot)).toBe(false)
  })
})

describe('formatSlot', () => {
  it('shows the weekday, date and time', () => {
    expect(formatSlot('2026-11-02T09:00')).toBe('Mon, Nov 2 · 09:00')
  })
})
