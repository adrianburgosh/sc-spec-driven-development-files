import type { Child } from 'hono/jsx'
import { raw } from 'hono/html'

type LayoutProps = {
  title: string
  children: Child
}

export const Header = () => (
  <header class="site-header">
    <a class="brand" href="/">
      AgentClinic
    </a>
  </header>
)

export const Main = ({ children }: { children: Child }) => <main class="site-main">{children}</main>

export const Footer = () => (
  <footer class="site-footer">
    <p>Take a deep breath, clear your context, and come back anytime.</p>
  </footer>
)

export const Layout = ({ title, children }: LayoutProps) => (
  <>
    {raw('<!DOCTYPE html>')}
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Header />
        <Main>{children}</Main>
        <Footer />
      </body>
    </html>
  </>
)
