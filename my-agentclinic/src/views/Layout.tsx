import type { Child } from 'hono/jsx'
import { raw } from 'hono/html'
import { Footer } from './Footer.js'
import { Header } from './Header.js'
import { Main } from './Main.js'

type LayoutProps = {
  title: string
  current?: string
  children: Child
}

export const Layout = ({ title, current, children }: LayoutProps) => (
  <>
    {raw('<!DOCTYPE html>')}
    <html lang="en" data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="/pico.min.css" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Header current={current} />
        <Main>{children}</Main>
        <Footer />
      </body>
    </html>
  </>
)
