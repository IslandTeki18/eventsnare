// Scheduled maintenance (CLAUDE.md "Crons"). Kept intentionally minimal: bounded retention
// sweeps for the two tables that grow without an existing cleanup path.
//
//   - deliveryStatsHourly (P3 rollup): one row per (source, hour). Drop buckets older than the
//     longest plan retention window so the table stays bounded over the product's lifetime.
//   - rateLimits: fixed-window counter rows are never read once their window passes; sweep rows
//     whose window is over a day old (all live windows are minutes/hours).
//
// Each sweep pages with a per-run delete cap so a single cron invocation can never run an
// unbounded transaction; remaining rows are caught on the next run.

import { cronJobs } from 'convex/server';
import { internalMutation } from './_generated/server';
import { internal } from './_generated/api';

const DAY_MS = 86_400_000;
const STATS_RETENTION_MS = 400 * DAY_MS; // > longest plan window (365d), plus buffer
const RATE_LIMIT_RETENTION_MS = DAY_MS;
const SWEEP_PAGE = 500;
const MAX_DELETES_PER_RUN = 5_000;

export const sweepDeliveryStats = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ deleted: number }> => {
    const cutoff = Date.now() - STATS_RETENTION_MS;
    let deleted = 0;
    let cursor: string | null = null;
    while (deleted < MAX_DELETES_PER_RUN) {
      const page = await ctx.db
        .query('deliveryStatsHourly')
        .paginate({ numItems: SWEEP_PAGE, cursor });
      for (const row of page.page) {
        if (row.hourBucket < cutoff) {
          await ctx.db.delete(row._id);
          deleted++;
        }
      }
      if (page.isDone) break;
      cursor = page.continueCursor;
    }
    return { deleted };
  },
});

export const sweepRateLimits = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ deleted: number }> => {
    const cutoff = Date.now() - RATE_LIMIT_RETENTION_MS;
    let deleted = 0;
    let cursor: string | null = null;
    while (deleted < MAX_DELETES_PER_RUN) {
      const page = await ctx.db.query('rateLimits').paginate({ numItems: SWEEP_PAGE, cursor });
      for (const row of page.page) {
        if (row.windowStartMs < cutoff) {
          await ctx.db.delete(row._id);
          deleted++;
        }
      }
      if (page.isDone) break;
      cursor = page.continueCursor;
    }
    return { deleted };
  },
});

const crons = cronJobs();
crons.daily('sweep delivery stats rollup', { hourUTC: 4, minuteUTC: 0 }, internal.crons.sweepDeliveryStats, {});
crons.daily('sweep rate limit counters', { hourUTC: 4, minuteUTC: 30 }, internal.crons.sweepRateLimits, {});

export default crons;
