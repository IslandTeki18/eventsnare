// Production ingress hot path (simulated delivery).
//
// This is the exact transactional path the real edge worker will drive once it lands:
// receive a verified event -> dedup -> persist -> increment usage counter -> schedule
// delivery, all inside a single Convex mutation so a returned success implies durable
// persistence (SPEC durability invariant). The stress harness calls ingestEvent to prove
// Convex sustains the target ingress rate (SPEC NFR-REL-3) before the real path is built.
//
// Delivery here is simulated: the scheduled action sleeps 50ms instead of making a real
// outbound HTTP request. The goal is to measure whether the Convex scheduler keeps up with
// the ingress rate (SPEC NFR-REL-4 first-delivery latency), not to test real egress.

import { v } from 'convex/values';
import { internalAction, internalMutation, mutation } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';

// UTC YYYY-MM billing period. Usage counters roll up per calendar month in UTC so the
// dedup/increment is deterministic regardless of the caller's timezone.
function billingPeriodUTC(epochMs: number): string {
  const d = new Date(epochMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const ingestEvent = mutation({
  args: {
    sourceId: v.id('sources'),
    providerEventId: v.string(),
    eventType: v.string(),
    signatureValid: v.boolean(),
    rawBodyInline: v.optional(v.string()),
    receivedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Dedup on (sourceId, providerEventId). First write wins; a duplicate is a no-op.
    const existing = await ctx.db
      .query('events')
      .withIndex('by_dedup_key', (q) =>
        q.eq('sourceId', args.sourceId).eq('providerEventId', args.providerEventId),
      )
      .first();
    if (existing) {
      return { eventId: existing._id, deduplicated: true };
    }

    // 2. Load the source; it must exist for the event to belong anywhere.
    const source = await ctx.db.get(args.sourceId);
    if (!source) {
      throw new Error(`Source not found: ${args.sourceId}`);
    }

    const receivedAt = args.receivedAt ?? Date.now();

    // 3. Persist the event before returning, satisfying the durability invariant.
    const eventId = await ctx.db.insert('events', {
      sourceId: args.sourceId,
      workspaceId: source.workspaceId,
      providerEventId: args.providerEventId,
      eventType: args.eventType,
      signatureValid: args.signatureValid,
      rawBodyInline: args.rawBodyInline,
      receivedAt,
      status: 'received',
      attemptCount: 0,
    });

    // 4. Atomically increment the monthly usage counter, creating the row on first event.
    const billingPeriod = billingPeriodUTC(receivedAt);
    const counter = await ctx.db
      .query('usageCounters')
      .withIndex('by_workspace_period', (q) =>
        q.eq('workspaceId', source.workspaceId).eq('billingPeriod', billingPeriod),
      )
      .first();
    if (counter) {
      await ctx.db.patch(counter._id, { eventCount: counter.eventCount + 1 });
    } else {
      await ctx.db.insert('usageCounters', {
        workspaceId: source.workspaceId,
        billingPeriod,
        eventCount: 1,
      });
    }

    // 5. Only signature-valid events are forwarded; schedule immediate delivery.
    if (args.signatureValid) {
      await ctx.scheduler.runAfter(0, internal.ingress.simulatedDelivery, { eventId });
    }

    return { eventId, deduplicated: false };
  },
});

export const simulatedDelivery = internalAction({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    // Mimic an outbound HTTP request without making one. Measures scheduler throughput.
    await new Promise((resolve) => setTimeout(resolve, 50));
    await ctx.runMutation(internal.ingress.recordDeliverySuccess, { eventId });
  },
});

export const recordDeliverySuccess = internalMutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }: { eventId: Id<'events'> }) => {
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }
    const now = Date.now();
    const attemptNumber = event.attemptCount + 1;
    await ctx.db.insert('deliveryAttempts', {
      eventId,
      attemptNumber,
      startedAt: now,
      completedAt: now,
      statusCode: 200,
    });
    await ctx.db.patch(eventId, {
      status: 'delivered',
      attemptCount: attemptNumber,
    });
  },
});
