import type { Appointment } from '../types.js'
import { AppointmentList } from './AppointmentList.js'
import { Layout } from './Layout.js'

type AppointmentsPageProps = {
  appointments: Appointment[]
}

export const AppointmentsPage = ({ appointments }: AppointmentsPageProps) => (
  <Layout title="Appointments · AgentClinic" current="/appointments">
    <h1>Upcoming appointments</h1>
    <p>One agent per slot, so everyone gets the clinic's full attention (and its full context window).</p>
    {appointments.length === 0 ? (
      <p class="empty-state">The calendar is wide open. A rare moment of peace.</p>
    ) : (
      <AppointmentList appointments={appointments} />
    )}
  </Layout>
)
