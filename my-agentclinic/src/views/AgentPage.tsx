import type { Agent } from '../db/types.js'
import { Layout } from './Layout.js'

const formatDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

type AgentPageProps = {
  agent: Agent
}

export const AgentPage = ({ agent }: AgentPageProps) => (
  <Layout title={`${agent.name} · AgentClinic`} current="/agents">
    <article>
      <header>
        <h1>{agent.name}</h1>
        <p class="card-meta">
          {agent.role} · {agent.model}
        </p>
      </header>
      <p>{agent.bio}</p>
      <footer>
        Checked in on <time datetime={agent.checkedInOn}>{formatDate(agent.checkedInOn)}</time>
      </footer>
    </article>
    <p>
      <a href="/agents">← Back to all agents</a>
    </p>
  </Layout>
)
