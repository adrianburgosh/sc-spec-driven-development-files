import type { Agent, Ailment, Appointment, Therapy } from '../types.js'
import { AppointmentList } from './AppointmentList.js'
import { Layout } from './Layout.js'
import { SeverityBadge } from './SeverityBadge.js'

type AgentDashboardPageProps = {
  agent: Agent
  ailments: Ailment[]
  suggestedTherapies: Therapy[]
  appointments: Appointment[]
}

export const AgentDashboardPage = ({ agent, ailments, suggestedTherapies, appointments }: AgentDashboardPageProps) => (
  <Layout title={`${agent.name}'s dashboard · AgentClinic`} current="/agents">
    <h1>Hi, {agent.name}</h1>
    <p>Here's everything about your care in one place. Take your time; there's no rate limit here.</p>
    <p>
      <a href={`/appointments/new?agent=${agent.id}`} role="button">
        Book an appointment
      </a>
    </p>
    <div class="dashboard-grid">
      <section aria-labelledby="my-ailments">
        <h2 id="my-ailments">My ailments</h2>
        {ailments.length === 0 ? (
          <p class="empty-state">Nothing on file. Either feeling great or very good at hiding it.</p>
        ) : (
          <ul>
            {ailments.map((ailment) => (
              <li>
                {ailment.name} <SeverityBadge severity={ailment.severity} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="suggested-therapies">
        <h2 id="suggested-therapies">Suggested therapies</h2>
        {suggestedTherapies.length === 0 ? (
          <p class="empty-state">No suggestions yet. Browse all <a href="/therapies">therapies</a> instead.</p>
        ) : (
          <ul>
            {suggestedTherapies.map((therapy) => (
              <li>
                <a href={`/therapies#therapy-${therapy.id}`}>{therapy.name}</a> ({therapy.durationMinutes} min)
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
    <section aria-labelledby="my-appointments">
      <h2 id="my-appointments">My upcoming appointments</h2>
      {appointments.length === 0 ? (
        <p class="empty-state">Nothing booked yet. Your calendar is as clear as a fresh context window.</p>
      ) : (
        <AppointmentList appointments={appointments} cancelRedirect={`/agents/${agent.id}/dashboard`} />
      )}
    </section>
    <p>
      <a href={`/agents/${agent.id}`}>← Back to {agent.name}'s profile</a>
    </p>
  </Layout>
)
