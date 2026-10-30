import { Layout } from './Layout.js'

export const AppointmentNotFoundPage = () => (
  <Layout title="Appointment not found · AgentClinic" current="/appointments">
    <h1>Appointment not found</h1>
    <p>
      We couldn't cancel that one. It may never have existed, it may already be cancelled, or it may
      have already started (in which case: breathe, you're doing great).
    </p>
    <p>
      <a href="/appointments">← Back to appointments</a>
    </p>
  </Layout>
)
