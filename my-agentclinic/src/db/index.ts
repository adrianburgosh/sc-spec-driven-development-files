import { mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { fromRoot } from '../paths.js'

export type Db = DatabaseSync

// Next to this module: src/db/ under tsx, dist/db/ after `npm run build` copies it.
const schemaPath = fileURLToPath(new URL('./schema.sql', import.meta.url))

export const dbPath = process.env.DB_PATH ?? fromRoot('data/agentclinic.db')

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
