import type { Db } from './index.js'
import type { Feedback } from '../types.js'

export type FeedbackInput = Pick<Feedback, 'agentId' | 'message'>

export const createFeedback = (db: Db, f: FeedbackInput): number =>
  Number(
    db.prepare('INSERT INTO feedback (agent_id, message) VALUES (?, ?)').run(f.agentId, f.message).lastInsertRowid,
  )

// `created_at` has whole seconds only, so `id` keeps entries from the same second newest first.
export const listFeedback = (db: Db): Feedback[] =>
  db
    .prepare(
      `SELECT feedback.id, feedback.agent_id AS agentId, agents.name AS agentName,
              feedback.message, feedback.created_at AS createdAt
       FROM feedback
       LEFT JOIN agents ON agents.id = feedback.agent_id
       ORDER BY feedback.created_at DESC, feedback.id DESC`,
    )
    .all() as Feedback[]
