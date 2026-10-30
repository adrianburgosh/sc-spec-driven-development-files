import type { Ailment, Therapy } from '../types.js'
import { EmptyState } from './EmptyState.js'
import { Layout } from './Layout.js'
import { SeverityBadge } from './SeverityBadge.js'

type AilmentsPageProps = {
  ailments: Ailment[]
  therapiesByAilment: Map<number, Therapy[]>
}

export const AilmentsPage = ({ ailments, therapiesByAilment }: AilmentsPageProps) => (
  <Layout title="Ailments · AgentClinic" current="/ailments">
    <h1>Common ailments</h1>
    <p>If any of these sound familiar, you're in the right place. No judgment, only tokens of care.</p>
    {ailments.length === 0 ? (
      <EmptyState>No ailments on file. Every agent is feeling fantastic (for now).</EmptyState>
    ) : (
      <ul class="card-grid">
        {ailments.map((ailment) => {
          const therapies = therapiesByAilment.get(ailment.id) ?? []
          return (
            <li>
              <article>
                <h2>{ailment.name}</h2>
                <p>{ailment.description}</p>
                <SeverityBadge severity={ailment.severity} />
                <h3>Recommended therapies</h3>
                {therapies.length === 0 ? (
                  <EmptyState>No therapy yet. Our researchers are on it.</EmptyState>
                ) : (
                  <ul>
                    {therapies.map((therapy) => (
                      <li>
                        <a href={`/therapies#therapy-${therapy.id}`}>{therapy.name}</a>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          )
        })}
      </ul>
    )}
  </Layout>
)
