import type { EndpointHealth } from '@/features/analytics/lib/types';

const STYLES: Record<EndpointHealth, { label: string; className: string }> = {
  healthy: { label: 'Healthy', className: 'bg-emerald-500/15 text-emerald-400' },
  degraded: { label: 'Degraded', className: 'bg-amber-500/15 text-amber-400' },
  down: { label: 'Down', className: 'bg-rose-500/15 text-rose-400' },
  idle: { label: 'Idle', className: 'bg-muted text-muted-foreground' },
};

export function EndpointHealthBadge({ health }: { health: EndpointHealth }) {
  const { label, className } = STYLES[health];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{label}</span>
  );
}
