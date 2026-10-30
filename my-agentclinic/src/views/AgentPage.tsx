import type { Agent, Ailment } from '../types.js'
import { EmptyState } from './EmptyState.js'
import { Layout } from './Layout.js'
import { SeverityBadge } from './SeverityBadge.js'

const formatDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

type AgentPageProps = {
  agent: Agent
  ailments: Ailment[]
}

export const AgentPage = ({ agent, ailments }: AgentPageProps) => (
  <Layout title={`${agent.name} · AgentClinic`} current="/agents">
    <article>
      <header>
        <h1>{agent.name}</h1>
        <p class="card-meta">
          {agent.role} · {agent.model}
        </p>
      </header>
      <p>{agent.bio}</p>
      <h2>Current ailments</h2>
      {ailments.length === 0 ? (
        <EmptyState>Nothing on file. Either feeling great or very good at hiding it.</EmptyState>
      ) : (
        <ul class="ailment-list">
          {ailments.map((ailment) => (
            <li>
              {ailment.name} <SeverityBadge severity={ailment.severity} />
            </li>
          ))}
        </ul>
      )}
      <footer>
        Checked in on <time datetime={agent.checkedInOn}>{formatDate(agent.checkedInOn)}</time>
      </footer>
    </article>
    <p>
      <a href={`/agents/${agent.id}/dashboard`} role="button">
        Open {agent.name}'s dashboard
      </a>
    </p>
    <p>
      <a href="/agents">← Back to all agents</a>
    </p>
  </Layout>
)
