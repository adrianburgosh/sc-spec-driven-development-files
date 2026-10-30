export type Agent = {
  id: number
  name: string
  model: string
  role: string
  bio: string
  checkedInOn: string
}

export type Severity = 'mild' | 'moderate' | 'severe'

export type Ailment = {
  id: number
  name: string
  description: string
  severity: Severity
}

export type Therapy = {
  id: number
  name: string
  description: string
  durationMinutes: number
}
