// CLI local-delivery queue (P5). When delivery.attempt finds an active listen session for a
// source, it hands the event off here instead of POSTing to the production forward URL. The CLI
// then drains the queue over a reactive subscription (pending), claims each item, forwards it to
// localhost, and reports the result (ackDelivery).
//
// Unlike production delivery, a failed local forward is NOT retried on the backoff schedule and
// never dead-letters — a developer's laptop being unreachable is not a production incident. The
// outcome is recorded for observability and the event stays replayable.

import { v } from 'convex/values';
import { action, internalMutation, mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { bumpDeliveryStats } from './lib/deliveryStats';
import { loadVerifiedSession } from './cliSessions';
import { hashCliToken } from './lib/cliAuth';

// Hand an event to a connected listener. Called from delivery.attempt (an action) after it has
// built the final outgoing header map. If the session has ended between the routing query and
// this write, fall back to production delivery so the event is never silently dropped.
export const createLocalDelivery = internalMutation({
  args: {
    eventId: v.id('events'),
    sessionId: v.id('cliSessions'),
    attemptNumber: v.number(),
    headersJson: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return;
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== 'active' || session.sourceId !== event.sourceId) {
      // Lost the listener mid-handoff; resume the normal delivery path.
      await ctx.scheduler.runAfter(0, internal.delivery.attempt, { eventId: args.eventId });
      return;
    }

    await ctx.db.insert('localDeliveries', {
      eventId: args.eventId,
      sourceId: event.sourceId,
      workspaceId: event.workspaceId,
      sessionId: args.sessionId,
      status: 'pending',
      attemptNumber: args.attemptNumber,
      headersJson: args.headersJson,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.eventId, { status: 'delivering' });
  },
});

interface PendingDelivery {
  localDeliveryId: Id<'localDeliveries'>;
  eventId: Id<'events'>;
  attemptNumber: number;
  headers: Record<string, string>;
  body: string | null;
  bodyStorageUrl: string | null;
}

// Reactive subscription target. Returns the source's unclaimed local deliveries for an active
// session, with the body inline (<=100KB) or a short-lived storage URL the CLI can GET. Returns
// an empty list the instant the session ends or the token is revoked, which is how the CLI stops
// receiving work without any push from the server.
export const pending = query({
  args: { sessionId: v.id('cliSessions'), secret: v.string() },
  handler: async (ctx, { sessionId, secret }): Promise<PendingDelivery[]> => {
    const session = await loadVerifiedSession(ctx, sessionId, secret);
    if (!session || session.status !== 'active') return [];

    const rows = await ctx.db
      .query('localDeliveries')
      .withIndex('by_session_status', (q) =>
        q.eq('sessionId', sessionId).eq('status', 'pending'),
      )
      .collect();

    const out: PendingDelivery[] = [];
    for (const row of rows) {
      const event = await ctx.db.get(row.eventId);
      if (!event) continue;
      out.push({
        localDeliveryId: row._id,
        eventId: row.eventId,
        attemptNumber: row.attemptNumber,
        headers: JSON.parse(row.headersJson) as Record<string, string>,
        body: event.rawBodyInline ?? null,
        bodyStorageUrl: event.rawBodyStorageId
          ? await ctx.storage.getUrl(event.rawBodyStorageId)
          : null,
      });
    }
    return out;
  },
});

// Atomically take ownership of a pending delivery. Convex mutations are serializable, so a second
// listener (or a re-fired subscription) that races here sees status !== 'pending' and backs off.
export const claimDelivery = mutation({
  args: {
    sessionId: v.id('cliSessions'),
    secret: v.string(),
    localDeliveryId: v.id('localDeliveries'),
  },
  handler: async (ctx, { sessionId, secret, localDeliveryId }): Promise<{ claimed: boolean }> => {
    const session = await loadVerifiedSession(ctx, sessionId, secret);
    if (!session || session.status !== 'active') return { claimed: false };
    const row = await ctx.db.get(localDeliveryId);
    if (!row || row.sessionId !== sessionId || row.status !== 'pending') return { claimed: false };
    await ctx.db.patch(localDeliveryId, { status: 'claimed', claimedAt: Date.now() });
    return { claimed: true };
  },
});

// Report the outcome of a forwarded request. Records a deliveryAttempts row and rolls the result
// into the hourly stats exactly like production delivery, but never schedules a retry.
export const ackDelivery = mutation({
  args: {
    sessionId: v.id('cliSessions'),
    secret: v.string(),
    localDeliveryId: v.id('localDeliveries'),
    statusCode: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    latencyMs: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    const session = await loadVerifiedSession(ctx, args.sessionId, args.secret);
    if (!session) return;
    const row = await ctx.db.get(args.localDeliveryId);
    if (!row || row.sessionId !== args.sessionId) return;
    if (row.status === 'done' || row.status === 'failed') return; // idempotent

    const event = await ctx.db.get(row.eventId);
    if (!event) return;

    const success =
      args.statusCode !== undefined && args.statusCode >= 200 && args.statusCode < 300;
    const completedAt = Date.now();
    const startedAt = completedAt - Math.max(0, args.latencyMs);

    await ctx.db.insert('deliveryAttempts', {
      eventId: row.eventId,
      attemptNumber: row.attemptNumber,
      startedAt,
      completedAt,
      statusCode: args.statusCode,
      errorMessage: args.errorMessage,
    });

    await bumpDeliveryStats(ctx, {
      workspaceId: event.workspaceId,
      sourceId: event.sourceId,
      completedAt,
      latencyMs: Math.max(0, args.latencyMs),
      success,
      statusCode: args.statusCode,
      deadLettered: false,
    });

    await ctx.db.patch(row.eventId, {
      status: success ? 'delivered' : 'failed',
      attemptCount: row.attemptNumber,
      nextAttemptAt: undefined,
      lastStatusCode: args.statusCode,
      lastErrorMessage: args.errorMessage,
    });

    await ctx.db.patch(args.localDeliveryId, {
      status: success ? 'done' : 'failed',
      completedAt,
      statusCode: args.statusCode,
      errorMessage: args.errorMessage,
    });
  },
});

// `eventsnare replay`: re-schedule an event for delivery. Routes to the connected listener (if
// any) automatically, since delivery.attempt makes the routing decision. Token-authenticated.
export const replayEvent = action({
  args: { token: v.string(), eventId: v.id('events') },
  handler: async (ctx, { token, eventId }): Promise<void> => {
    const context = await ctx.runQuery(internal.cliSessions.resolveContext, {
      tokenHash: await hashCliToken(token),
    });
    if (!context) throw new Error('Invalid or revoked CLI token. Run `eventsnare login` again.');
    await ctx.runMutation(internal.cliDelivery.replayEventInternal, {
      workspaceId: context.workspaceId,
      eventId,
    });
  },
});

export const replayEventInternal = internalMutation({
  args: { workspaceId: v.id('workspaces'), eventId: v.id('events') },
  handler: async (ctx, { workspaceId, eventId }): Promise<void> => {
    const event = await ctx.db.get(eventId);
    if (!event || event.workspaceId !== workspaceId) throw new Error('Event not found');
    await ctx.db.patch(eventId, {
      status: 'received',
      attemptCount: 0,
      nextAttemptAt: undefined,
      deadLetterAt: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.delivery.attempt, { eventId });
  },
});
