import { Layout } from './Layout.js'

export const ErrorPage = () => (
  <Layout title="Something went wrong · AgentClinic">
    <h1>Something went wrong</h1>
    <p>
      Even clinics have off days. Something broke on our side, not yours. We've made a note of it, and
      a nice cup of tea is on its way to the server.
    </p>
    <p>
      <a href="/">← Back to the front desk</a>
    </p>
  </Layout>
)
