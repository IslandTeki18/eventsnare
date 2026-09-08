import type { OverviewSeriesPoint } from '@/features/analytics/lib/types';

// Deliveries-per-hour strip: one column per hourly bucket, failures stacked above successes,
// each column scaled against the busiest bucket in the window.

export function DeliveryBars({ series }: { series: OverviewSeriesPoint[] }) {
  const peak = series.reduce((max, point) => Math.max(max, point.attempts), 0);

  return (
    <div className="border-b border-border px-[22px] pb-5 pt-[18px]">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium">Deliveries per hour</span>
        <div className="flex items-center gap-3.5 text-xs text-subtle">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-ok" />
            Succeeded
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-bad" />
            Failed
          </span>
        </div>
      </div>
      <div className="flex h-[54px] items-end gap-[3px]">
        {series.map((point) => (
          <div
            key={point.hourBucket}
            className="flex h-full min-w-0 flex-1 flex-col justify-end"
            title={`${point.succeeded} succeeded, ${point.failed} failed`}
          >
            <div
              className="bg-bad"
              style={{ height: peak === 0 ? 0 : `${(point.failed / peak) * 100}%` }}
            />
            <div
              className="bg-ok"
              style={{ height: peak === 0 ? 0 : `${(point.succeeded / peak) * 100}%` }}
            />
            <div className="h-px bg-rail" />
          </div>
        ))}
      </div>
      <div className="mt-[7px] flex justify-between text-2xs text-subtle">
        <span>24 hours ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}
