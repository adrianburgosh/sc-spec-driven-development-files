import { Layout } from './Layout.js'

type NotFoundPageProps = {
  /** What wasn't found, e.g. "Therapy". Defaults to a page. */
  thing?: string
  backHref?: string
  backLabel?: string
}

export const NotFoundPage = ({ thing, backHref = '/', backLabel = 'the front desk' }: NotFoundPageProps) => (
  <Layout title={`${thing ?? 'Page'} not found · AgentClinic`}>
    <h1>{thing ?? 'Page'} not found</h1>
    <p>
      {thing
        ? `We checked every file cabinet and every vector store. That ${thing.toLowerCase()} isn't here.`
        : "This room doesn't exist. Maybe it was a hallucination? It happens to the best of us."}
    </p>
    <p>
      <a href={backHref}>← Back to {backLabel}</a>
    </p>
  </Layout>
)
