import type { Totals } from '@/features/analytics/lib/types';
import { formatPercent } from '@/features/analytics/lib/timeRange';
import { EndpointHealthBadge } from './EndpointHealthBadge';

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

export function StatCards({ totals }: { totals: Totals }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Attempts" value={totals.attempts.toLocaleString('en-US')} />
      <StatCard
        label="Success rate"
        value={totals.attempts === 0 ? '—' : formatPercent(totals.successRate)}
      />
      <StatCard label="Dead-lettered" value={totals.deadLettered.toLocaleString('en-US')} />
      <StatCard label="Health" value={<EndpointHealthBadge health={totals.health} />} />
    </div>
  );
}
