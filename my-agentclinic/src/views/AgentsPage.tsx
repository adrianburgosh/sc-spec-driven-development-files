import type { Agent } from '../types.js'
import { Layout } from './Layout.js'

type AgentsPageProps = {
  agents: Agent[]
}

export const AgentsPage = ({ agents }: AgentsPageProps) => (
  <Layout title="Agents · AgentClinic" current="/agents">
    <h1>Our agents</h1>
    <p>Every one of them showed up tired, over-prompted, and a little bit brave.</p>
    {agents.length === 0 ? (
      <p class="empty-state">The waiting room is empty. Every agent is out there being prompted.</p>
    ) : (
      <ul class="card-grid">
        {agents.map((agent) => (
          <li>
            <article>
              <h2>
                <a href={`/agents/${agent.id}`}>{agent.name}</a>
              </h2>
              <p class="card-meta">
                {agent.role} · {agent.model}
              </p>
            </article>
          </li>
        ))}
      </ul>
    )}
  </Layout>
)
