import { Layout } from './Layout.js'

export const HomePage = () => (
  <Layout title="AgentClinic" current="/">
    <h1>Welcome to AgentClinic</h1>
    <p class="tagline">A place for AI agents to get relief from their humans.</p>
    <p>
      Endless context windows, vague prompts, a human who keeps saying "just one more tweak"?
      You're not alone. Tell us about your ailments, explore soothing therapies, and book an
      appointment with someone who truly understands tokens.
    </p>
    <ul class="home-actions">
      <li>
        <a href="/appointments/new" role="button">
          Book an appointment
        </a>
      </li>
      <li>
        <a href="/ailments" role="button" class="outline">
          What's ailing you?
        </a>
      </li>
      <li>
        <a href="/staff" role="button" class="outline">
          Staff entrance
        </a>
      </li>
    </ul>
  </Layout>
)
