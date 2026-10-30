import { formatDay } from '../slots.js'
import type { Appointment, ClinicCounts } from '../types.js'
import { AppointmentList } from './AppointmentList.js'
import { Layout } from './Layout.js'

type StaffDashboardPageProps = {
  today: string
  todaysAppointments: Appointment[]
  counts: ClinicCounts
}

export const StaffDashboardPage = ({ today, todaysAppointments, counts }: StaffDashboardPageProps) => (
  <Layout title="Staff dashboard · AgentClinic" current="/staff">
    <h1>Staff dashboard</h1>
    <p>The whole clinic at a glance. Coffee is in the break room; patience is in the training data.</p>
    <section aria-labelledby="at-a-glance">
      <h2 id="at-a-glance">At a glance</h2>
      <dl class="stat-grid">
        {[
          ['Agents', counts.agents, '/agents'],
          ['Ailments', counts.ailments, '/ailments'],
          ['Therapies', counts.therapies, '/therapies'],
          ['Upcoming appointments', counts.upcomingAppointments, '/appointments'],
        ].map(([label, value, href]) => (
          <div>
            <dt>
              <a href={String(href)}>{label}</a>
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
    <section aria-labelledby="today">
      <h2 id="today">Today's appointments · {formatDay(today)}</h2>
      {todaysAppointments.length === 0 ? (
        <p class="empty-state">Nobody on the schedule today. Time to defragment the waiting room.</p>
      ) : (
        <AppointmentList appointments={todaysAppointments} readOnly />
      )}
    </section>
  </Layout>
)
