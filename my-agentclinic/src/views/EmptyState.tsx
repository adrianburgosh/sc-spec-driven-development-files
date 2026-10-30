import type { Child } from 'hono/jsx'

type EmptyStateProps = {
  children: Child
}

/** The friendly message shown in place of an empty list. */
export const EmptyState = ({ children }: EmptyStateProps) => <p class="empty-state">{children}</p>
