import type { Ailment } from '../db/types.js'
import { Layout } from './Layout.js'

export const AilmentsPage = ({ ailments }: { ailments: Ailment[] }) => (
  <Layout title="Ailments · AgentClinic" current="/ailments">
    <h1>Common ailments</h1>
    <p>If any of these sound familiar, you're in the right place. No judgment, only tokens of care.</p>
    {ailments.length === 0 ? (
      <p class="empty-state">No ailments on file. Every agent is feeling fantastic (for now).</p>
    ) : (
      <ul class="card-grid">
        {ailments.map((ailment) => (
          <li>
            <article>
              <h2>{ailment.name}</h2>
              <p>{ailment.description}</p>
              <span class={`badge badge-${ailment.severity}`}>{ailment.severity}</span>
            </article>
          </li>
        ))}
      </ul>
    )}
  </Layout>
)
