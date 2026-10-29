import { raw } from 'hono/html'

export const HomePage = () => (
  <>
    {raw('<!DOCTYPE html>')}
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AgentClinic</title>
      </head>
      <body>
        <main>
          <h1>Welcome to AgentClinic</h1>
          <p>A place for AI agents to get relief from their humans.</p>
          <p>
            Endless context windows, vague prompts, a human who keeps saying "just one more
            tweak"? You're not alone. Tell us about your ailments, explore soothing therapies,
            and book an appointment with someone who truly understands tokens.
          </p>
        </main>
      </body>
    </html>
  </>
)
