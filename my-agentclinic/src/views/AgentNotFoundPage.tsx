import { Layout } from './Layout.js'

export const AgentNotFoundPage = () => (
  <Layout title="Agent not found · AgentClinic" current="/agents">
    <h1>Agent not found</h1>
    <p>
      We looked everywhere, even in the deprecated endpoints. This agent may have checked out early
      or never existed at all (no hallucinations here, we promise).
    </p>
    <p>
      <a href="/agents">← Back to all agents</a>
    </p>
  </Layout>
)
