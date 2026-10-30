import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { fromRoot } from './paths.js'

const css = readFileSync(fromRoot('public/styles.css'), 'utf8')

// Hex values of the custom properties declared in styles.css, e.g. tokens['--color-primary'].
const tokens = Object.fromEntries(
  [...css.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map(([, name, hex]) => [name, hex!]),
)

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

// WCAG AA for normal-size text.
const AA = 4.5

describe('styles.css text contrast (WCAG AA)', () => {
  it.each([
    ['body text on the main card', '--color-text', '--color-surface'],
    ['muted text on the main card', '--color-muted', '--color-surface'],
    ['muted text on the page background', '--color-muted', '--color-bg'],
    ['links on the main card', '--color-primary-dark', '--color-surface'],
    ['links on the page background', '--color-primary-dark', '--color-bg'],
    ['hovered links on the main card', '--pico-primary-hover', '--color-surface'],
    ['header links on the header bar', '--color-surface', '--color-primary-dark'],
    ['the tagline on the main card', '--color-accent-text', '--color-surface'],
    ['body text on a highlighted appointment', '--color-text', '--color-highlight'],
    ['links on a highlighted appointment', '--color-primary-dark', '--color-highlight'],
    ['form errors on the main card', '--color-error', '--color-surface'],
    ['Cancel buttons on a highlighted appointment', '--color-muted', '--color-highlight'],
    ['links on a count tile', '--color-primary-dark', '--color-bg'],
    ['mild badges', '--badge-mild-text', '--badge-mild-bg'],
    ['moderate badges', '--badge-moderate-text', '--badge-moderate-bg'],
    ['severe badges', '--badge-severe-text', '--badge-severe-bg'],
  ])('%s', (_, fg, bg) => {
    expect(tokens[fg], fg).toBeDefined()
    expect(tokens[bg], bg).toBeDefined()
    expect(contrast(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(AA)
  })

  it('uses the dark primary for the header bar and the text coral for the tagline', () => {
    expect(css).toMatch(/\.site-header\s*\{[^}]*background:\s*var\(--color-primary-dark\)/)
    expect(css).toMatch(/\.tagline\s*\{[^}]*color:\s*var\(--color-accent-text\)/)
  })

  it('gives header links a visible focus outline', () => {
    expect(css).toMatch(/a:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-surface\)/)
  })
})
