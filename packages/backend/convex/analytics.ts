// Observability queries (P3). Read exclusively from the deliveryStatsHourly rollup, never from
// raw deliveryAttempts, so chart loads stay O(hours-in-range). All reads are workspace-scoped
// and reactive: the dashboard updates live as new attempts roll in.

import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { requireWorkspace } from './workspaces';
import { percentileFromBuckets } from './lib/deliveryStats';

type EndpointHealth = 'healthy' | 'degraded' | 'down' | 'idle';

function successRate(succeeded: number, attempts: number): number {
  return attempts === 0 ? 1 : succeeded / attempts;
}

// Banded health from the window's success rate. Idle when there were no attempts at all.
function healthOf(succeeded: number, attempts: number): EndpointHealth {
  if (attempts === 0) return 'idle';
  const rate = successRate(succeeded, attempts);
  if (rate >= 0.99) return 'healthy';
  if (rate >= 0.9) return 'degraded';
  return 'down';
}

function pointFromRow(row: Doc<'deliveryStatsHourly'>) {
  return {
    hourBucket: row.hourBucket,
    attempts: row.attempts,
    succeeded: row.succeeded,
    failed: row.failed,
    deadLettered: row.deadLettered,
    successRate: successRate(row.succeeded, row.attempts),
    p50: percentileFromBuckets(row.latencyBuckets, 0.5),
    p95: percentileFromBuckets(row.latencyBuckets, 0.95),
    statusCounts: row.statusCounts,
  };
}

// Per-source time series + error breakdown for the window. Powers the per-source Analytics tab.
export const getSourceStats = query({
  args: {
    sourceId: v.id('sources'),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
    const workspace = await requireWorkspace(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.workspaceId !== workspace._id) return null;

    const rows = await ctx.db
      .query('deliveryStatsHourly')
      .withIndex('by_source_hour', (q) =>
        q.eq('sourceId', args.sourceId).gte('hourBucket', args.from).lte('hourBucket', args.to),
      )
      .collect();

    const series = rows.map(pointFromRow);
    const totals = aggregateTotals(rows);
    const statusCounts = mergeStatusCounts(rows);

    return {
      series,
      statusCounts,
      totals: {
        ...totals,
        successRate: successRate(totals.succeeded, totals.attempts),
        health: healthOf(totals.succeeded, totals.attempts),
      },
    };
  },
});

// Workspace-wide overview: window totals, an hour-bucketed series summed across sources, and a
// per-source summary card list. Powers the top-level Analytics dashboard.
export const getWorkspaceOverview = query({
  args: {
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
    const workspace = await requireWorkspace(ctx);

    const rows = await ctx.db
      .query('deliveryStatsHourly')
      .withIndex('by_workspace_hour', (q) =>
        q
          .eq('workspaceId', workspace._id)
          .gte('hourBucket', args.from)
          .lte('hourBucket', args.to),
      )
      .collect();

    // Series: sum every source's rollup for the same hour into one workspace-level point.
    const byHour = new Map<number, { attempts: number; succeeded: number; failed: number }>();
    const bySource = new Map<
      Id<'sources'>,
      { attempts: number; succeeded: number; failed: number; deadLettered: number }
    >();
    for (const row of rows) {
      const h = byHour.get(row.hourBucket) ?? { attempts: 0, succeeded: 0, failed: 0 };
      h.attempts += row.attempts;
      h.succeeded += row.succeeded;
      h.failed += row.failed;
      byHour.set(row.hourBucket, h);

      const s = bySource.get(row.sourceId) ?? {
        attempts: 0,
        succeeded: 0,
        failed: 0,
        deadLettered: 0,
      };
      s.attempts += row.attempts;
      s.succeeded += row.succeeded;
      s.failed += row.failed;
      s.deadLettered += row.deadLettered;
      bySource.set(row.sourceId, s);
    }

    const series = [...byHour.entries()]
      .map(([hourBucket, v2]) => ({
        hourBucket,
        ...v2,
        successRate: successRate(v2.succeeded, v2.attempts),
      }))
      .sort((a, b) => a.hourBucket - b.hourBucket);

    // Resolve source names for the cards; only surface sources that have rollup data in range.
    const sources = await ctx.db
      .query('sources')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    const nameById = new Map(sources.map((s) => [s._id, s] as const));

    const sourceCards = [...bySource.entries()].map(([sourceId, s]) => {
      const src = nameById.get(sourceId);
      return {
        sourceId,
        name: src?.name ?? 'Unknown source',
        forwardUrl: src?.forwardUrl ?? '',
        attempts: s.attempts,
        succeeded: s.succeeded,
        failed: s.failed,
        deadLettered: s.deadLettered,
        successRate: successRate(s.succeeded, s.attempts),
        health: healthOf(s.succeeded, s.attempts),
      };
    });
    sourceCards.sort((a, b) => b.attempts - a.attempts);

    const totals = aggregateTotals(rows);

    return {
      series,
      sources: sourceCards,
      totals: {
        ...totals,
        successRate: successRate(totals.succeeded, totals.attempts),
        health: healthOf(totals.succeeded, totals.attempts),
      },
    };
  },
});

function aggregateTotals(rows: Doc<'deliveryStatsHourly'>[]) {
  return rows.reduce(
    (acc, r) => ({
      attempts: acc.attempts + r.attempts,
      succeeded: acc.succeeded + r.succeeded,
      failed: acc.failed + r.failed,
      deadLettered: acc.deadLettered + r.deadLettered,
    }),
    { attempts: 0, succeeded: 0, failed: 0, deadLettered: 0 },
  );
}

function mergeStatusCounts(rows: Doc<'deliveryStatsHourly'>[]): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const row of rows) {
    for (const [code, count] of Object.entries(row.statusCounts)) {
      merged[code] = (merged[code] ?? 0) + count;
    }
  }
  return merged;
}
