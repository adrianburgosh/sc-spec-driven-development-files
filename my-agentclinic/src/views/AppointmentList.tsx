import { formatSlot } from '../slots.js'
import type { Appointment } from '../types.js'

type AppointmentListProps = {
  appointments: Appointment[]
  highlightId?: number
  /** Where to land after cancelling. Defaults to /appointments. */
  cancelRedirect?: string
  /** Hide the Cancel buttons (e.g. for a list that includes appointments already under way). */
  readOnly?: boolean
}

export const AppointmentList = ({ appointments, highlightId, cancelRedirect, readOnly }: AppointmentListProps) => (
  <ul class="appointment-list">
    {appointments.map((appointment) => (
      <li class={appointment.id === highlightId ? 'highlight' : undefined}>
        <time datetime={appointment.slot}>{formatSlot(appointment.slot)}</time>
        <span>
          <a href={`/agents/${appointment.agentId}`}>{appointment.agentName}</a> · {appointment.therapyName}
        </span>
        {!readOnly && (
          <form method="post" action={`/appointments/${appointment.id}/cancel`}>
            {cancelRedirect && <input type="hidden" name="redirect" value={cancelRedirect} />}
            <button
              type="submit"
              class="secondary outline"
              aria-label={`Cancel ${appointment.therapyName} for ${appointment.agentName} on ${formatSlot(appointment.slot)}`}
            >
              Cancel
            </button>
          </form>
        )}
      </li>
    ))}
  </ul>
)
