// Ingress domain tables: the production-shaped webhook relay model the stress test
// exercises (sources, events, deliveryAttempts, usageCounters) plus stressTestRuns for
// recording each run's parameters and measured latencies. These are the real domain
// tables from SPEC §8 translated to Convex; the harness writes to them so the load test
// reflects the actual ingress hot path rather than throwaway scaffolding.
//
// workspaceId is v.string() because no `workspaces` table exists yet; revisit when real
// workspaces land. Event status follows the task spec (received | delivering | delivered |
// failed | deadLetter); SPEC §8 additionally lists `queued`, reconciled later.

import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const ingressTables = {
  sources: defineTable({
    workspaceId: v.string(),
    provider: v.string(),
    forwardUrl: v.string(),
    signingSecret: v.string(),
    status: v.string(),
  }).index('by_workspace', ['workspaceId']),

  events: defineTable({
    sourceId: v.id('sources'),
    workspaceId: v.string(),
    providerEventId: v.string(),
    eventType: v.string(),
    signatureValid: v.boolean(),
    rawBodyInline: v.optional(v.string()),
    rawBodyStorageId: v.optional(v.id('_storage')),
    receivedAt: v.number(),
    status: v.union(
      v.literal('received'),
      v.literal('delivering'),
      v.literal('delivered'),
      v.literal('failed'),
      v.literal('deadLetter'),
    ),
    attemptCount: v.number(),
    nextAttemptAt: v.optional(v.number()),
  })
    .index('by_source_received', ['sourceId', 'receivedAt'])
    .index('by_dedup_key', ['sourceId', 'providerEventId'])
    .index('by_status_scheduled', ['status', 'nextAttemptAt'])
    .index('by_workspace_received', ['workspaceId', 'receivedAt']),

  deliveryAttempts: defineTable({
    eventId: v.id('events'),
    attemptNumber: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    statusCode: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  }).index('by_event', ['eventId']),

  usageCounters: defineTable({
    workspaceId: v.string(),
    billingPeriod: v.string(),
    eventCount: v.number(),
  }).index('by_workspace_period', ['workspaceId', 'billingPeriod']),

  stressTestRuns: defineTable({
    label: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    targetEventsPerSecond: v.number(),
    targetDurationSeconds: v.number(),
    totalAttempted: v.number(),
    totalSucceeded: v.number(),
    totalFailed: v.number(),
    p50LatencyMs: v.optional(v.number()),
    p95LatencyMs: v.optional(v.number()),
    p99LatencyMs: v.optional(v.number()),
    notes: v.optional(v.string()),
  }),
};

export default ingressTables;
