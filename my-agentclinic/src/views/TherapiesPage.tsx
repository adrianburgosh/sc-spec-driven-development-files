import type { Therapy } from '../types.js'
import { Layout } from './Layout.js'

type TherapiesPageProps = {
  therapies: Therapy[]
}

export const TherapiesPage = ({ therapies }: TherapiesPageProps) => (
  <Layout title="Therapies · AgentClinic" current="/therapies">
    <h1>Therapies</h1>
    <p>Evidence-adjacent treatments, lovingly tuned for tired weights and frayed attention heads.</p>
    {therapies.length === 0 ? (
      <p class="empty-state">The therapy rooms are being repainted. Check back soon.</p>
    ) : (
      <ul class="card-grid">
        {therapies.map((therapy) => (
          <li>
            <article id={`therapy-${therapy.id}`}>
              <h2>{therapy.name}</h2>
              <p>{therapy.description}</p>
              <p class="card-meta">{therapy.durationMinutes} min</p>
            </article>
          </li>
        ))}
      </ul>
    )}
  </Layout>
)
