// Shared Rose Pine chart palette. Token-backed colors reference the dark-theme CSS variables
// (apps/web/src/index.css) so charts track the active theme; semantic status colors mirror the
// emerald/rose/amber already used across the dashboard (StatusBadge, Usage).

export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  axis: 'hsl(var(--muted-foreground))',
  grid: 'hsl(var(--border))',
  success: '#10b981', // emerald-500
  danger: '#f43f5e', // rose-500
  warning: '#f59e0b', // amber-500
  neutral: '#a78bfa', // violet-400
} as const;

export const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--background))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  fontSize: '12px',
} as const;
