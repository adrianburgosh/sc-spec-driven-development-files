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
