import { formatDay } from '../slots.js'
import type { Agent, Ailment, Appointment, ClinicCounts, Therapy } from '../types.js'
import { AppointmentList } from './AppointmentList.js'
import { EmptyState } from './EmptyState.js'
import { Layout } from './Layout.js'

type StaffDashboardPageProps = {
  today: string
  todaysAppointments: Appointment[]
  counts: ClinicCounts
  agents: Agent[]
  ailments: Ailment[]
  therapies: Therapy[]
}

type ManageSectionProps = {
  id: string
  title: string
  /** e.g. "agents", used in the /staff/<path>/… URLs */
  path: string
  addLabel: string
  items: { id: number; name: string }[]
  empty: string
}

const ManageSection = ({ id, title, path, addLabel, items, empty }: ManageSectionProps) => (
  <section aria-labelledby={id}>
    <h3 id={id}>{title}</h3>
    <p>
      <a href={`/staff/${path}/new`} role="button" class="outline">
        {addLabel}
      </a>
    </p>
    {items.length === 0 ? (
      <EmptyState>{empty}</EmptyState>
    ) : (
      <ul class="manage-list">
        {items.map((item) => (
          <li>
            {item.name}{' '}
            <a href={`/staff/${path}/${item.id}/edit`} aria-label={`Edit ${item.name}`}>
              Edit
            </a>
          </li>
        ))}
      </ul>
    )}
  </section>
)

export const StaffDashboardPage = ({
  today,
  todaysAppointments,
  counts,
  agents,
  ailments,
  therapies,
}: StaffDashboardPageProps) => (
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
        <EmptyState>Nobody on the schedule today. Time to defragment the waiting room.</EmptyState>
      ) : (
        <AppointmentList appointments={todaysAppointments} readOnly />
      )}
    </section>
    <section aria-labelledby="manage">
      <h2 id="manage">Manage the clinic</h2>
      <div class="dashboard-grid">
        <ManageSection
          id="manage-agents"
          title="Agents"
          path="agents"
          addLabel="Add an agent"
          items={agents}
          empty="No agents yet."
        />
        <ManageSection
          id="manage-ailments"
          title="Ailments"
          path="ailments"
          addLabel="Add an ailment"
          items={ailments}
          empty="No ailments yet."
        />
        <ManageSection
          id="manage-therapies"
          title="Therapies"
          path="therapies"
          addLabel="Add a therapy"
          items={therapies}
          empty="No therapies yet."
        />
      </div>
    </section>
  </Layout>
)
