import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export type Db = DatabaseSync

// Resolved from the project root so it works from both src/ (tsx) and dist/ (build).
const schemaPath = resolve('src/db/schema.sql')

export const dbPath = process.env.DB_PATH ?? 'data/agentclinic.db'

export const migrate = (db: Db) => {
  db.exec(readFileSync(schemaPath, 'utf8'))
}

export const openDb = (path: string = dbPath): Db => {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  return db
}
