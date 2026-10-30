import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { fromRoot } from '../paths.js'

const viewsDir = fromRoot('src/views')
const viewFiles = readdirSync(viewsDir).filter((f) => f.endsWith('.tsx') && !f.includes('.test.'))

describe('views', () => {
  it.each(viewFiles)('%s does not import from src/db/', (file) => {
    const source = readFileSync(`${viewsDir}/${file}`, 'utf8')

    expect(source).not.toMatch(/from ['"][./]*db\//)
  })
})
