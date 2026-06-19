import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { rangeWindow, type RangeKey } from '@/features/analytics/lib/timeRange';
import { TimeRangePicker } from './TimeRangePicker';
import { StatCards } from './StatCards';
import { SuccessRateChart } from './SuccessRateChart';
import { VolumeChart } from './VolumeChart';
import { LatencyChart } from './LatencyChart';
import { ErrorBreakdown } from './ErrorBreakdown';

// Per-source observability, embedded in the source detail Analytics tab. Owns its own range
// state so it is independent of the workspace overview.
export function SourceAnalytics({ sourceId }: { sourceId: Id<'sources'> }) {
  // Freeze the window per range selection so query args stay stable (cacheable, no slide). The
  // clock is read only in the lazy initializer and the change handler, never during render.
  const [range, setRange] = useState<RangeKey>('24h');
  const [window, setWindow] = useState(() => rangeWindow('24h', Date.now()));
  const selectRange = (next: RangeKey) => {
    setRange(next);
    setWindow(rangeWindow(next, Date.now()));
  };

  const stats = useQuery(api.analytics.getSourceStats, {
    sourceId,
    from: window.from,
    to: window.to,
  });

  if (stats === undefined) {
    return <p className="text-sm text-muted-foreground">Loading analytics…</p>;
  }
  if (stats === null) {
    return <p className="text-sm text-muted-foreground">Source not found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <TimeRangePicker value={range} onChange={selectRange} />
      </div>
      <StatCards totals={stats.totals} />
      <SuccessRateChart series={stats.series} rangeKey={range} />
      <div className="grid gap-4 lg:grid-cols-2">
        <VolumeChart series={stats.series} rangeKey={range} />
        <LatencyChart series={stats.series} rangeKey={range} />
      </div>
      <ErrorBreakdown statusCounts={stats.statusCounts} />
    </div>
  );
}
