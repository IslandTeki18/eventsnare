// Time-range selection for the observability dashboard (P3). A range key maps to a [from, to]
// epoch-ms window passed to the analytics queries. Kept pure so it is trivially testable and
// shared by the workspace overview and the per-source tab.

export type RangeKey = '24h' | '7d' | '30d';

const DAY_MS = 86_400_000;

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
];

export function rangeWindow(key: RangeKey, now: number): { from: number; to: number } {
  const spans: Record<RangeKey, number> = {
    '24h': DAY_MS,
    '7d': 7 * DAY_MS,
    '30d': 30 * DAY_MS,
  };
  return { from: now - spans[key], to: now };
}

// X-axis tick label. Hourly granularity for 24h, day/month for longer ranges.
export function formatBucket(hourBucket: number, key: RangeKey): string {
  const d = new Date(hourBucket);
  if (key === '24h') {
    return d.toLocaleTimeString('en-US', { hour: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}
