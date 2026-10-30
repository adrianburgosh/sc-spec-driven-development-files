import { describe, expect, it } from 'vitest'
import { Footer } from './Footer.js'
import { Header } from './Header.js'
import { Layout } from './Layout.js'
import { Main } from './Main.js'

describe('Layout', () => {
  it('composes Header, Main and Footer in order', async () => {
    const page = await (
      <Layout title="Test">
        <p>Page content</p>
      </Layout>
    ).toString()

    const header = await (<Header />).toString()
    const main = await (
      <Main>
        <p>Page content</p>
      </Main>
    ).toString()
    const footer = await (<Footer />).toString()

    expect(page).toContain(`<body>${header}${main}${footer}</body>`)
  })

  it('uses the given title', async () => {
    const page = await (<Layout title="Test">{null}</Layout>).toString()

    expect(page).toContain('<title>Test</title>')
  })

  it('renders the main nav links', async () => {
    const page = await (<Layout title="Test">{null}</Layout>).toString()
    const nav = page.match(/<nav aria-label="Main">(.*)<\/nav>/s)?.[1] ?? ''

    expect(nav).toContain('<a href="/">Home</a>')
    expect(nav).toContain('<a href="/agents">Agents</a>')
    expect(nav).toContain('<a href="/ailments">Ailments</a>')
    expect(nav).toContain('<a href="/therapies">Therapies</a>')
    expect(nav).toContain('<a href="/appointments">Appointments</a>')
  })

  it('marks only the current page link with aria-current', async () => {
    const page = await (
      <Layout title="Test" current="/agents">
        {null}
      </Layout>
    ).toString()

    expect(page.match(/aria-current="page"/g)).toHaveLength(1)
    expect(page).toContain('<a href="/agents" aria-current="page">Agents</a>')
  })

  it('marks no link when there is no current page', async () => {
    const page = await (<Layout title="Test">{null}</Layout>).toString()

    expect(page).not.toContain('aria-current')
  })
})
