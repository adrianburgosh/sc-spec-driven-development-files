import type { Severity } from '../types.js'

type SeverityBadgeProps = {
  severity: Severity
}

export const SeverityBadge = ({ severity }: SeverityBadgeProps) => (
  <span class={`badge badge-${severity}`}>{severity}</span>
)
