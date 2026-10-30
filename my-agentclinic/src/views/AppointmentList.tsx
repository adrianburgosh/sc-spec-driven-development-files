import { formatSlot } from '../slots.js'
import type { Appointment } from '../types.js'

type AppointmentListProps = {
  appointments: Appointment[]
  highlightId?: number
}

export const AppointmentList = ({ appointments, highlightId }: AppointmentListProps) => (
  <ul class="appointment-list">
    {appointments.map((appointment) => (
      <li class={appointment.id === highlightId ? 'highlight' : undefined}>
        <time datetime={appointment.slot}>{formatSlot(appointment.slot)}</time>
        <span>
          <a href={`/agents/${appointment.agentId}`}>{appointment.agentName}</a> · {appointment.therapyName}
        </span>
      </li>
    ))}
  </ul>
)
