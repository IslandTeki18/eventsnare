// One-off backfill for the P4 event search index. New events populate searchText (and, after
// their first delivery, lastStatusCode) on the hot path; existing rows predate those fields and
// must be filled once so they become searchable. Run:
//
//   npx convex run searchTextMigration:backfillSearchText
//
// Idempotent and resumable: it pages through events, (re)derives searchText for every row, and
// best-effort sets lastStatusCode from the row's latest delivery attempt. Re-running is safe.

import { v } from 'convex/values';
import { internalAction, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { buildSearchText } from './lib/searchText';

const PAGE_SIZE = 200;

export const backfillPage = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }): Promise<{ cursor: string | null; isDone: boolean; patched: number }> => {
    const page = await ctx.db
      .query('events')
      .paginate({ numItems: PAGE_SIZE, cursor });

    let patched = 0;
    for (const event of page.page) {
      const searchText = buildSearchText(
        event.eventType,
        event.providerEventId,
        event.rawBodyInline,
      );

      let lastStatusCode = event.lastStatusCode;
      if (lastStatusCode === undefined) {
        const attempts = await ctx.db
          .query('deliveryAttempts')
          .withIndex('by_event', (q) => q.eq('eventId', event._id))
          .collect();
        if (attempts.length > 0) {
          attempts.sort((a, b) => b.attemptNumber - a.attemptNumber);
          lastStatusCode = attempts[0]!.statusCode;
        }
      }

      await ctx.db.patch(event._id, { searchText, lastStatusCode });
      patched++;
    }

    return { cursor: page.continueCursor, isDone: page.isDone, patched };
  },
});

export const backfillSearchText = internalAction({
  args: {},
  handler: async (ctx): Promise<{ pages: number; patched: number }> => {
    let cursor: string | null = null;
    let pages = 0;
    let patched = 0;
    for (;;) {
      const result: { cursor: string | null; isDone: boolean; patched: number } =
        await ctx.runMutation(internal.searchTextMigration.backfillPage, { cursor });
      pages++;
      patched += result.patched;
      if (result.isDone) break;
      cursor = result.cursor;
    }
    return { pages, patched };
  },
});
