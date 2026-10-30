import type { Db } from './index.js'
import type { Ailment } from '../types.js'

export const listAilments = (db: Db): Ailment[] =>
  db.prepare('SELECT id, name, description, severity FROM ailments ORDER BY name').all() as Ailment[]
