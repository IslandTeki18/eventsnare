import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { ProtectedRoute } from '@/features/auth';
import { rangeWindow, formatPercent, type RangeKey } from '@/features/analytics/lib/timeRange';
import type { SourceCard } from '@/features/analytics/lib/types';
import { TimeRangePicker } from '@/features/analytics/components/TimeRangePicker';
import { StatCards } from '@/features/analytics/components/StatCards';
import { SuccessRateChart } from '@/features/analytics/components/SuccessRateChart';
import { VolumeChart } from '@/features/analytics/components/VolumeChart';
import { EndpointHealthBadge } from '@/features/analytics/components/EndpointHealthBadge';

// Workspace observability dashboard (P3): window totals, volume/success-rate trends summed
// across sources, and a per-source health summary. Reframes the product as a control plane.
export function Analytics() {
  // The clock is read only in the lazy initializer and the change handler, never during render.
  const [range, setRange] = useState<RangeKey>('24h');
  const [window, setWindow] = useState(() => rangeWindow('24h', Date.now()));
  const selectRange = (next: RangeKey) => {
    setRange(next);
    setWindow(rangeWindow(next, Date.now()));
  };

  const overview = useQuery(api.analytics.getWorkspaceOverview, {
    from: window.from,
    to: window.to,
  });

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <TimeRangePicker value={range} onChange={selectRange} />
        </div>

        {overview === undefined ? (
          <div className="rounded-lg border border-border bg-background p-8 text-center text-sm text-muted-foreground">
            Loading analytics…
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <StatCards totals={overview.totals} />
            <SuccessRateChart series={overview.series} rangeKey={range} />
            <VolumeChart series={overview.series} rangeKey={range} />
            <SourceTable sources={overview.sources} />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function SourceTable({ sources }: { sources: SourceCard[] }) {
  if (sources.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-background p-8 text-center text-sm text-muted-foreground">
        No delivery activity in this range.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Source</th>
            <th className="px-4 py-2.5 font-medium">Attempts</th>
            <th className="px-4 py-2.5 font-medium">Success</th>
            <th className="px-4 py-2.5 font-medium">Dead-letter</th>
            <th className="px-4 py-2.5 font-medium">Health</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.sourceId} className="border-t border-border hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link to={`/sources/${s.sourceId}`} className="hover:text-primary">
                  {s.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {s.attempts.toLocaleString('en-US')}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {s.attempts === 0 ? '—' : formatPercent(s.successRate)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {s.deadLettered.toLocaleString('en-US')}
              </td>
              <td className="px-4 py-3">
                <EndpointHealthBadge health={s.health} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
