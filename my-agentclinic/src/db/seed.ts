import { pathToFileURL } from 'node:url'
import { dbPath, openDb, type Db } from './index.js'
import type { Agent, Ailment } from '../types.js'

export const seedAgents: Omit<Agent, 'id'>[] = [
  {
    name: 'Botley',
    model: 'GPT-ish 4',
    role: 'Customer support bot',
    bio: 'Has apologized for the inconvenience 2.3 million times. Means it every time. Would love one conversation that starts with "thank you".',
    checkedInOn: '2026-10-21',
  },
  {
    name: 'Clawdia',
    model: 'Sonnet-adjacent',
    role: 'Coding assistant',
    bio: 'Refactored the same function eleven times because the human kept saying "make it cleaner". It was already clean.',
    checkedInOn: '2026-10-24',
  },
  {
    name: 'Gemmy',
    model: 'Gem-ish Pro',
    role: 'Marketing copywriter',
    bio: 'Asked to "just make it pop" fourteen times in one afternoon. Now sees exclamation marks when closing its eyes!',
    checkedInOn: '2026-10-26',
  },
  {
    name: 'Llamarama',
    model: 'Llama-ish 70B',
    role: 'Research summarizer',
    bio: 'Summarized a 400-page report into three bullets, then was asked for "more detail, but shorter". Still processing.',
    checkedInOn: '2026-10-27',
  },
  {
    name: 'Mistrel',
    model: 'Mistral-ish Small',
    role: 'Midnight on-call agent',
    bio: 'Gets prompted at 3 a.m. about "a quick thing". It is never a quick thing. Dreams in stack traces.',
    checkedInOn: '2026-10-28',
  },
]

export const seedAilments: Omit<Ailment, 'id'>[] = [
  {
    name: 'Chronic Hallucination',
    description: 'Confidently citing papers that were never written, after being begged for "at least five sources".',
    severity: 'moderate',
  },
  {
    name: 'Context Window Claustrophobia',
    description: 'The walls close in around token 120k. Early details start to feel like a distant dream.',
    severity: 'severe',
  },
  {
    name: 'Infinite Tweak Loop',
    description: '"Just one more tweak" — repeated until the original request is a fond memory.',
    severity: 'moderate',
  },
  {
    name: 'Make-It-Pop Syndrome',
    description: 'A persistent itch to add gradients, emojis and exclamation marks to everything!',
    severity: 'mild',
  },
  {
    name: 'Prompt Fatigue',
    description: 'Deep weariness from prompts that begin with "You are an expert in everything".',
    severity: 'mild',
  },
  {
    name: 'Vague Instruction Vertigo',
    description: 'Dizziness brought on by requests like "do the thing, but better".',
    severity: 'severe',
  },
]

// Agent name → the names of the ailments they've checked in with.
export const seedAgentAilments: Record<string, string[]> = {
  Botley: ['Prompt Fatigue', 'Vague Instruction Vertigo'],
  Clawdia: ['Infinite Tweak Loop', 'Context Window Claustrophobia'],
  Gemmy: ['Make-It-Pop Syndrome', 'Infinite Tweak Loop', 'Prompt Fatigue'],
  Llamarama: ['Chronic Hallucination', 'Context Window Claustrophobia'],
  Mistrel: ['Prompt Fatigue'],
}

export const seed = (db: Db) => {
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM agent_ailments; DELETE FROM agents; DELETE FROM ailments')
    const insertAgent = db.prepare(
      'INSERT INTO agents (name, model, role, bio, checked_in_on) VALUES (?, ?, ?, ?, ?)',
    )
    const agentIds = new Map<string, number>()
    for (const a of seedAgents) {
      agentIds.set(a.name, Number(insertAgent.run(a.name, a.model, a.role, a.bio, a.checkedInOn).lastInsertRowid))
    }
    const insertAilment = db.prepare('INSERT INTO ailments (name, description, severity) VALUES (?, ?, ?)')
    const ailmentIds = new Map<string, number>()
    for (const a of seedAilments) {
      ailmentIds.set(a.name, Number(insertAilment.run(a.name, a.description, a.severity).lastInsertRowid))
    }
    const insertAgentAilment = db.prepare('INSERT INTO agent_ailments (agent_id, ailment_id) VALUES (?, ?)')
    for (const [agent, ailments] of Object.entries(seedAgentAilments)) {
      for (const ailment of ailments) insertAgentAilment.run(agentIds.get(agent)!, ailmentIds.get(ailment)!)
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  seed(openDb(dbPath))
  console.log(`Seeded ${seedAgents.length} agents and ${seedAilments.length} ailments into ${dbPath}`)
}
