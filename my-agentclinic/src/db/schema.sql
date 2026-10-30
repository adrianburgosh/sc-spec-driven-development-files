-- Runs on every startup: every statement must be safe to repeat.

CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL,
  checked_in_on TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ailments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe'))
);

CREATE TABLE IF NOT EXISTS agent_ailments (
  agent_id INTEGER NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  ailment_id INTEGER NOT NULL REFERENCES ailments (id) ON DELETE CASCADE,
  PRIMARY KEY (agent_id, ailment_id)
);

CREATE TABLE IF NOT EXISTS therapies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0)
);

CREATE TABLE IF NOT EXISTS ailment_therapies (
  ailment_id INTEGER NOT NULL REFERENCES ailments (id) ON DELETE CASCADE,
  therapy_id INTEGER NOT NULL REFERENCES therapies (id) ON DELETE CASCADE,
  PRIMARY KEY (ailment_id, therapy_id)
);
