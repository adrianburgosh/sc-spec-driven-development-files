import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// One level up from this file is the project root, both from src/ (tsx) and dist/ (build),
// so the app works no matter which directory it's started from.
export const projectRoot = fileURLToPath(new URL('..', import.meta.url))

export const fromRoot = (path: string) => join(projectRoot, path)
