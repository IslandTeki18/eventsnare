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

// P5 local-forwarding hygiene. A local delivery that no listener claims/acks within this window is
// presumed abandoned (CLI killed mid-stream) and expired; the event is marked failed so it is not
// stuck in `delivering` and remains replayable. Sessions whose heartbeat lapsed are ended.
const LOCAL_DELIVERY_TTL_MS = 60_000;
const SESSION_END_MS = 120_000;
const MAX_UPDATES_PER_RUN = 5_000;

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

// Expire abandoned local deliveries (P5) and reset their events out of the `delivering` limbo.
export const sweepLocalDeliveries = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ expired: number }> => {
    const cutoff = Date.now() - LOCAL_DELIVERY_TTL_MS;
    let expired = 0;
    let cursor: string | null = null;
    while (expired < MAX_UPDATES_PER_RUN) {
      const page = await ctx.db
        .query('localDeliveries')
        .paginate({ numItems: SWEEP_PAGE, cursor });
      for (const row of page.page) {
        const open = row.status === 'pending' || row.status === 'claimed';
        if (!open || row.createdAt >= cutoff) continue;
        await ctx.db.patch(row._id, {
          status: 'expired',
          completedAt: Date.now(),
          errorMessage: 'Local listener disconnected before delivery',
        });
        const event = await ctx.db.get(row.eventId);
        if (event && event.status === 'delivering') {
          await ctx.db.patch(row.eventId, {
            status: 'failed',
            lastErrorMessage: 'Local listener disconnected before delivery',
          });
        }
        expired++;
      }
      if (page.isDone) break;
      cursor = page.continueCursor;
    }
    return { expired };
  },
});

// End listen sessions whose heartbeat has lapsed (CLI process gone without a clean endSession).
export const sweepStaleSessions = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ ended: number }> => {
    const cutoff = Date.now() - SESSION_END_MS;
    let ended = 0;
    let cursor: string | null = null;
    while (ended < MAX_UPDATES_PER_RUN) {
      const page = await ctx.db.query('cliSessions').paginate({ numItems: SWEEP_PAGE, cursor });
      for (const row of page.page) {
        if (row.status === 'active' && row.lastSeenAt < cutoff) {
          await ctx.db.patch(row._id, { status: 'ended', endedAt: Date.now() });
          ended++;
        }
      }
      if (page.isDone) break;
      cursor = page.continueCursor;
    }
    return { ended };
  },
});

const crons = cronJobs();
crons.daily('sweep delivery stats rollup', { hourUTC: 4, minuteUTC: 0 }, internal.crons.sweepDeliveryStats, {});
crons.daily('sweep rate limit counters', { hourUTC: 4, minuteUTC: 30 }, internal.crons.sweepRateLimits, {});
crons.interval('sweep abandoned local deliveries', { seconds: 60 }, internal.crons.sweepLocalDeliveries, {});
crons.interval('sweep stale CLI sessions', { seconds: 60 }, internal.crons.sweepStaleSessions, {});

export default crons;
