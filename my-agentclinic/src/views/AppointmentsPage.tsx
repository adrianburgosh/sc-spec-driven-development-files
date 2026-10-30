import type { Appointment } from '../types.js'
import { AppointmentList } from './AppointmentList.js'
import { EmptyState } from './EmptyState.js'
import { Layout } from './Layout.js'

type AppointmentsPageProps = {
  appointments: Appointment[]
  /** The appointment that was just booked, if any. */
  bookedId?: number
}

export const AppointmentsPage = ({ appointments, bookedId }: AppointmentsPageProps) => {
  const booked = appointments.find((a) => a.id === bookedId)
  return (
    <Layout title="Appointments · AgentClinic" current="/appointments">
      <h1>Upcoming appointments</h1>
      <p>One agent per slot, so everyone gets the clinic's full attention (and its full context window).</p>
      {booked && (
        <p role="status" class="form-success">
          Booked! {booked.agentName} is all set for {booked.therapyName}.
        </p>
      )}
      <p>
        <a href="/appointments/new" role="button">
          Book an appointment
        </a>
      </p>
      {appointments.length === 0 ? (
        <EmptyState>The calendar is wide open. A rare moment of peace.</EmptyState>
      ) : (
        <AppointmentList appointments={appointments} highlightId={bookedId} />
      )}
    </Layout>
  )
}
