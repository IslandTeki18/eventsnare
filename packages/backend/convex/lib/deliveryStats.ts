// Per-source hourly delivery rollup (P3 observability). Maintained incrementally: every
// recorded delivery attempt upserts exactly one deliveryStatsHourly row (the (sourceId,
// hourBucket) it falls in), mirroring the usageCounters / bumpFailBurst increment-on-write
// pattern. Charts read the rollup, never the raw deliveryAttempts table, so aggregation stays
// O(hours-in-range) instead of O(attempts).

import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

const HOUR_MS = 3_600_000;

// Upper bounds (ms, exclusive) of each latency bucket. The final bucket is open-ended; an
// attempt with latency >= 30000ms lands in the last index. Keep in sync with LATENCY_BUCKETS.
export const LATENCY_EDGES = [100, 250, 500, 1000, 2000, 5000, 10000, 30000] as const;
export const LATENCY_BUCKET_COUNT = LATENCY_EDGES.length + 1;

export function hourBucketOf(epochMs: number): number {
  return Math.floor(epochMs / HOUR_MS) * HOUR_MS;
}

// Index of the latency bucket a value falls in. Values below the first edge land in bucket 0;
// values at or above the last edge land in the final (open-ended) bucket.
export function latencyBucketIndex(latencyMs: number): number {
  for (let i = 0; i < LATENCY_EDGES.length; i++) {
    if (latencyMs < LATENCY_EDGES[i]!) return i;
  }
  return LATENCY_EDGES.length;
}

// Approximate percentile from a histogram. Returns the upper edge of the bucket that contains
// the p-th item (p in [0,1]); the open-ended top bucket returns the last finite edge as a
// conservative lower estimate. Returns null when there are no samples. Approximation error is
// bounded by the bucket width, which is acceptable for ops dashboards.
export function percentileFromBuckets(buckets: number[], p: number): number | null {
  const total = buckets.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const target = p * total;
  let cumulative = 0;
  for (let i = 0; i < buckets.length; i++) {
    cumulative += buckets[i]!;
    if (cumulative >= target) {
      return i < LATENCY_EDGES.length ? LATENCY_EDGES[i]! : LATENCY_EDGES[LATENCY_EDGES.length - 1]!;
    }
  }
  return LATENCY_EDGES[LATENCY_EDGES.length - 1]!;
}

interface BumpArgs {
  workspaceId: Id<'workspaces'>;
  sourceId: Id<'sources'>;
  completedAt: number;
  latencyMs: number;
  success: boolean;
  statusCode?: number;
  deadLettered: boolean;
}

// Upsert one attempt's outcome into its hourly bucket. statusCode is keyed as a string; a
// transport failure with no HTTP response is keyed "error".
export async function bumpDeliveryStats(ctx: MutationCtx, args: BumpArgs): Promise<void> {
  const hourBucket = hourBucketOf(args.completedAt);
  const statusKey = args.statusCode !== undefined ? String(args.statusCode) : 'error';
  const bucketIdx = latencyBucketIndex(Math.max(0, args.latencyMs));

  const existing = await ctx.db
    .query('deliveryStatsHourly')
    .withIndex('by_source_hour', (q) =>
      q.eq('sourceId', args.sourceId).eq('hourBucket', hourBucket),
    )
    .first();

  if (!existing) {
    const latencyBuckets = new Array<number>(LATENCY_BUCKET_COUNT).fill(0);
    latencyBuckets[bucketIdx] = 1;
    await ctx.db.insert('deliveryStatsHourly', {
      workspaceId: args.workspaceId,
      sourceId: args.sourceId,
      hourBucket,
      attempts: 1,
      succeeded: args.success ? 1 : 0,
      failed: args.success ? 0 : 1,
      deadLettered: args.deadLettered ? 1 : 0,
      statusCounts: { [statusKey]: 1 },
      latencyBuckets,
    });
    return;
  }

  const latencyBuckets = [...existing.latencyBuckets];
  while (latencyBuckets.length < LATENCY_BUCKET_COUNT) latencyBuckets.push(0);
  latencyBuckets[bucketIdx] = (latencyBuckets[bucketIdx] ?? 0) + 1;

  const statusCounts = { ...existing.statusCounts };
  statusCounts[statusKey] = (statusCounts[statusKey] ?? 0) + 1;

  await ctx.db.patch(existing._id, {
    attempts: existing.attempts + 1,
    succeeded: existing.succeeded + (args.success ? 1 : 0),
    failed: existing.failed + (args.success ? 0 : 1),
    deadLettered: existing.deadLettered + (args.deadLettered ? 1 : 0),
    statusCounts,
    latencyBuckets,
  });
}
