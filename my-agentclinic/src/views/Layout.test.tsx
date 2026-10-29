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
})
