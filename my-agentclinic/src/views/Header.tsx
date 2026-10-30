const links = [
  { href: '/', label: 'Home' },
  { href: '/agents', label: 'Agents' },
  { href: '/ailments', label: 'Ailments' },
]

type HeaderProps = {
  current?: string
}

export const Header = ({ current }: HeaderProps) => (
  <header class="site-header">
    <nav aria-label="Main">
      <ul>
        <li>
          <a class="brand" href="/">
            AgentClinic
          </a>
        </li>
      </ul>
      <ul class="nav-links">
        {links.map(({ href, label }) => (
          <li>
            <a href={href} aria-current={href === current ? 'page' : undefined}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  </header>
)
