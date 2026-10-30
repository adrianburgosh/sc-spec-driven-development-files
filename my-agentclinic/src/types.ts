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

/** Which agents have an ailment and which therapies treat it. */
export type AilmentLinks = {
  agentIds: number[]
  therapyIds: number[]
}

export type Therapy = {
  id: number
  name: string
  description: string
  durationMinutes: number
}

export type AppointmentStatus = 'booked' | 'cancelled'

export type ClinicCounts = {
  agents: number
  ailments: number
  therapies: number
  upcomingAppointments: number
}

/** An appointment with the names a page needs to show it. */
export type Appointment = {
  id: number
  slot: string
  status: AppointmentStatus
  agentId: number
  agentName: string
  therapyId: number
  therapyName: string
}

/** Feedback for the clinic. `agentId` and `agentName` are null when it's anonymous. */
export type Feedback = {
  id: number
  agentId: number | null
  agentName: string | null
  message: string
  createdAt: string
}
