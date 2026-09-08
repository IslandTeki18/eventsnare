// Status hue lookup shared by the badge and the table row rail. Kept out of the component
// file so fast refresh stays component-only.

const STATUS_VAR: Record<string, string> = {
  delivered: 'var(--ok)',
  active: 'var(--ok)',
  received: 'var(--info)',
  delivering: 'var(--info)',
  failed: 'var(--warn)',
  paused: 'var(--warn)',
  deadLetter: 'var(--bad)',
};

// Left status rail on a table row's first cell.
export function statusRail(status: string): { boxShadow: string } {
  return { boxShadow: `inset 2px 0 0 hsl(${STATUS_VAR[status] ?? 'var(--rail-off)'})` };
}
