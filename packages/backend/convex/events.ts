// Dashboard event queries and replay (SPEC FR-DASH-1..4). All reads are workspace-scoped and
// reactive, so the event list and detail views update live without any SSE/WebSocket layer.

import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { requireWorkspace } from './workspaces';

const STATUS = v.union(
  v.literal('received'),
  v.literal('delivering'),
  v.literal('delivered'),
  v.literal('failed'),
  v.literal('deadLetter'),
);

// Filterable, paginated event list. Filters by source, status, event type, and received-at
// range (FR-DASH-1). Uses the source index when a source is selected, otherwise the
// workspace index; both ordered newest-first.
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sourceId: v.optional(v.id('sources')),
    status: v.optional(STATUS),
    eventType: v.optional(v.string()),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const workspace = await requireWorkspace(ctx);

    const indexed = args.sourceId
      ? ctx.db
          .query('events')
          .withIndex('by_source_received', (q) => q.eq('sourceId', args.sourceId!))
      : ctx.db
          .query('events')
          .withIndex('by_workspace_received', (q) => q.eq('workspaceId', workspace._id));

    const filtered = indexed
      .order('desc')
      .filter((q) => {
        const conditions = [q.eq(q.field('workspaceId'), workspace._id)];
        if (args.status) conditions.push(q.eq(q.field('status'), args.status));
        if (args.eventType) conditions.push(q.eq(q.field('eventType'), args.eventType));
        if (args.from !== undefined) {
          conditions.push(q.gte(q.field('receivedAt'), args.from));
        }
        if (args.to !== undefined) conditions.push(q.lte(q.field('receivedAt'), args.to));
        return conditions.reduce((acc, c) => q.and(acc, c));
      });

    return await filtered.paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const workspace = await requireWorkspace(ctx);
    const event = await ctx.db.get(eventId);
    if (!event || event.workspaceId !== workspace._id) return null;

    const attempts = await ctx.db
      .query('deliveryAttempts')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect();
    attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);

    const payloadUrl = event.rawBodyStorageId
      ? await ctx.storage.getUrl(event.rawBodyStorageId)
      : null;

    return {
      event,
      attempts,
      payloadInline: event.rawBodyInline ?? null,
      payloadUrl,
    };
  },
});

// Replay: give the event a fresh delivery lifecycle and schedule an immediate attempt
// (FR-DASH-3). Resets the retry budget so a previously dead-lettered event can be retried.
async function replayOne(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  eventId: Id<'events'>,
): Promise<boolean> {
  const event = await ctx.db.get(eventId);
  if (!event || event.workspaceId !== workspaceId) return false;
  await ctx.db.patch(eventId, {
    status: 'received',
    attemptCount: 0,
    nextAttemptAt: undefined,
    deadLetterAt: undefined,
  });
  await ctx.scheduler.runAfter(0, internal.delivery.attempt, { eventId });
  return true;
}

export const replay = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }): Promise<void> => {
    const workspace = await requireWorkspace(ctx);
    const ok = await replayOne(ctx, workspace._id, eventId);
    if (!ok) throw new Error('Event not found');
  },
});

export const replayBulk = mutation({
  args: { eventIds: v.array(v.id('events')) },
  handler: async (ctx, { eventIds }): Promise<{ replayed: number }> => {
    const workspace = await requireWorkspace(ctx);
    let replayed = 0;
    for (const eventId of eventIds) {
      if (await replayOne(ctx, workspace._id, eventId)) replayed++;
    }
    return { replayed };
  },
});
