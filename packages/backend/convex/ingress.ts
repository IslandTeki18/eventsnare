// Ingress hot path: the single durable persistence point for received webhook events.
//
// receive (verified upstream) -> dedup -> persist -> increment usage counter -> schedule
// delivery, all inside one Convex mutation so a returned success implies durable persistence
// (SPEC durability invariant FR-IN-4). Two entry points share one persist helper:
//
//   - ingestFromHttp (internal): the production path, driven by the ingress httpAction. It
//     persists the full request context (headers, source IP, original signature, inline or
//     File-Storage body) and schedules REAL outbound delivery (internal.delivery.attempt).
//   - ingestEvent (public): the stress harness path. It persists a minimal synthetic event
//     and schedules SIMULATED delivery (a 50ms sleep) so load tests measure scheduler
//     throughput without real egress.

import { v } from 'convex/values';
import { internalAction, internalMutation, mutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { billingPeriodUTC, planLimit, QUOTA_THRESHOLDS } from './lib/plans';
import { claimOnce } from './alerts/dispatch';
import { bumpDeliveryStats } from './lib/deliveryStats';
import { buildSearchText } from './lib/searchText';

interface PersistArgs {
  sourceId: Id<'sources'>;
  providerEventId: string;
  eventType: string;
  signatureValid: boolean;
  rawBodyInline?: string;
  rawBodyStorageId?: Id<'_storage'>;
  headersJson?: string;
  sourceIp?: string;
  originalSignature?: string;
  isTest?: boolean;
  receivedAt?: number;
}

interface PersistResult {
  eventId: Id<'events'>;
  deduplicated: boolean;
  created: boolean;
  signatureValid: boolean;
}

// Shared dedup + persist + usage-increment. Does NOT schedule delivery; the caller chooses
// the delivery policy (real vs simulated). Returns enough for the caller to decide.
async function persistEvent(ctx: MutationCtx, args: PersistArgs): Promise<PersistResult> {
  // 1. Dedup on (sourceId, providerEventId). First write wins; a duplicate is a no-op.
  const existing = await ctx.db
    .query('events')
    .withIndex('by_dedup_key', (q) =>
      q.eq('sourceId', args.sourceId).eq('providerEventId', args.providerEventId),
    )
    .first();
  if (existing) {
    return {
      eventId: existing._id,
      deduplicated: true,
      created: false,
      signatureValid: existing.signatureValid,
    };
  }

  // 2. Load the source; it must exist for the event to belong anywhere.
  const source = await ctx.db.get(args.sourceId);
  if (!source) throw new Error(`Source not found: ${args.sourceId}`);

  const receivedAt = args.receivedAt ?? Date.now();

  // 3. Persist the event before returning, satisfying the durability invariant.
  const eventId = await ctx.db.insert('events', {
    sourceId: args.sourceId,
    workspaceId: source.workspaceId,
    providerEventId: args.providerEventId,
    eventType: args.eventType,
    signatureValid: args.signatureValid,
    rawBodyInline: args.rawBodyInline,
    rawBodyStorageId: args.rawBodyStorageId,
    headersJson: args.headersJson,
    sourceIp: args.sourceIp,
    originalSignature: args.originalSignature,
    isTest: args.isTest,
    receivedAt,
    status: 'received',
    attemptCount: 0,
    searchText: buildSearchText(args.eventType, args.providerEventId, args.rawBodyInline),
  });

  // 4. Atomically increment the monthly usage counter, creating the row on first event.
  const billingPeriod = billingPeriodUTC(receivedAt);
  const counter = await ctx.db
    .query('usageCounters')
    .withIndex('by_workspace_period', (q) =>
      q.eq('workspaceId', source.workspaceId).eq('billingPeriod', billingPeriod),
    )
    .first();
  const newCount = counter ? counter.eventCount + 1 : 1;
  if (counter) {
    await ctx.db.patch(counter._id, { eventCount: newCount });
  } else {
    await ctx.db.insert('usageCounters', {
      workspaceId: source.workspaceId,
      billingPeriod,
      eventCount: newCount,
    });
  }

  // 5. Quota alerts (FR-ALERT-3): fire once per crossed threshold per billing period.
  const workspace = await ctx.db.get(source.workspaceId);
  if (workspace) {
    const limit = planLimit(workspace.plan);
    for (const threshold of QUOTA_THRESHOLDS) {
      if (newCount < Math.ceil(limit * threshold)) continue;
      const label = String(Math.round(threshold * 100));
      if (await claimOnce(ctx, source.workspaceId, `quota:${billingPeriod}:${label}`)) {
        await ctx.scheduler.runAfter(0, internal.alerts.dispatch.dispatchAlert, {
          workspaceId: source.workspaceId,
          type: 'quota',
          subject: `Usage at ${label}% of your ${workspace.plan} plan limit`,
          message: `Workspace "${workspace.name}" has used ${newCount} of ${limit} events this billing period (${billingPeriod}).`,
        });
      }
    }
  }

  return { eventId, deduplicated: false, created: true, signatureValid: args.signatureValid };
}

// Production ingress path. Persists full request context and schedules real delivery.
export const ingestFromHttp = internalMutation({
  args: {
    sourceId: v.id('sources'),
    providerEventId: v.string(),
    eventType: v.string(),
    signatureValid: v.boolean(),
    rawBodyInline: v.optional(v.string()),
    rawBodyStorageId: v.optional(v.id('_storage')),
    headersJson: v.optional(v.string()),
    sourceIp: v.optional(v.string()),
    originalSignature: v.optional(v.string()),
    isTest: v.optional(v.boolean()),
    receivedAt: v.optional(v.number()),
    // Set when the source is paused: persist the event (no lost events, FR-SRC-5) but do
    // not forward it.
    skipDelivery: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ eventId: Id<'events'>; deduplicated: boolean }> => {
    const result = await persistEvent(ctx, args);
    // Only forward freshly-persisted, signature-valid events (FR-IN-3), unless paused.
    if (result.created && result.signatureValid && !args.skipDelivery) {
      await ctx.scheduler.runAfter(0, internal.delivery.attempt, {
        eventId: result.eventId,
      });
    }
    return { eventId: result.eventId, deduplicated: result.deduplicated };
  },
});

// Stress-harness path. Minimal synthetic event; simulated delivery (no real egress).
export const ingestEvent = mutation({
  args: {
    sourceId: v.id('sources'),
    providerEventId: v.string(),
    eventType: v.string(),
    signatureValid: v.boolean(),
    rawBodyInline: v.optional(v.string()),
    receivedAt: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ eventId: Id<'events'>; deduplicated: boolean }> => {
    const result = await persistEvent(ctx, args);
    if (result.created && result.signatureValid) {
      await ctx.scheduler.runAfter(0, internal.ingress.simulatedDelivery, {
        eventId: result.eventId,
      });
    }
    return { eventId: result.eventId, deduplicated: result.deduplicated };
  },
});

export const simulatedDelivery = internalAction({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }): Promise<void> => {
    // Mimic an outbound HTTP request without making one. Measures scheduler throughput.
    await new Promise((resolve) => setTimeout(resolve, 50));
    await ctx.runMutation(internal.ingress.recordDeliverySuccess, { eventId });
  },
});

export const recordDeliverySuccess = internalMutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }: { eventId: Id<'events'> }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error(`Event not found: ${eventId}`);
    const now = Date.now();
    const attemptNumber = event.attemptCount + 1;
    await ctx.db.insert('deliveryAttempts', {
      eventId,
      attemptNumber,
      startedAt: now,
      completedAt: now,
      statusCode: 200,
    });
    // Mirror the production rollup + denormalization (P3/P4) so the stress harness exercises
    // the same observability path and its verification reconciles against raw attempts.
    await bumpDeliveryStats(ctx, {
      workspaceId: event.workspaceId,
      sourceId: event.sourceId,
      completedAt: now,
      latencyMs: 0,
      success: true,
      statusCode: 200,
      deadLettered: false,
    });
    await ctx.db.patch(eventId, {
      status: 'delivered',
      attemptCount: attemptNumber,
      lastStatusCode: 200,
    });
  },
});
