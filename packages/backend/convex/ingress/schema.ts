// Ingress domain tables: the production-shaped webhook relay model (sources, events,
// deliveryAttempts, usageCounters) plus stressTestRuns for recording each run's parameters
// and measured latencies. These are the real domain tables from SPEC §8 translated to
// Convex; the stress harness writes to them so the load test reflects the actual ingress
// hot path rather than throwaway scaffolding.
//
// workspaceId references the `workspaces` table (SPEC §8). Event status follows the task
// spec (received | delivering | delivered | failed | deadLetter); SPEC §8 additionally
// lists `queued`, reconciled later.
//
// Signing secrets are stored as `signingSecretEncrypted` (base64 of iv||ciphertext,
// AES-256-GCM, SPEC NFR-SEC-2). Plaintext only ever exists inside an action/httpAction.

import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const ingressTables = {
  sources: defineTable({
    workspaceId: v.id('workspaces'),
    provider: v.string(),
    name: v.string(),
    forwardUrl: v.string(),
    signingSecretEncrypted: v.string(),
    status: v.string(),
    maxRetries: v.number(),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
    // Outbound security (P2). forwardHeaders is an encrypted JSON map of custom headers added
    // to every forwarded request (values may hold bearer tokens). forwardHeaderKeys mirrors the
    // map's keys in plaintext so the dashboard can show which headers are set without decrypting.
    // outboundSigningSecretEncrypted is the HMAC secret used to sign forwarded requests so the
    // customer can verify they originated from Eventsnare.
    forwardHeaders: v.optional(v.string()),
    forwardHeaderKeys: v.optional(v.array(v.string())),
    outboundSigningSecretEncrypted: v.optional(v.string()),
  }).index('by_workspace', ['workspaceId']),

  events: defineTable({
    sourceId: v.id('sources'),
    workspaceId: v.id('workspaces'),
    providerEventId: v.string(),
    eventType: v.string(),
    signatureValid: v.boolean(),
    rawBodyInline: v.optional(v.string()),
    rawBodyStorageId: v.optional(v.id('_storage')),
    headersJson: v.optional(v.string()),
    sourceIp: v.optional(v.string()),
    originalSignature: v.optional(v.string()),
    isTest: v.optional(v.boolean()),
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
    deadLetterAt: v.optional(v.number()),
    // Search + structured filters (P4). searchText is a derived, length-capped haystack
    // (eventType + providerEventId + an inline-body prefix) backing the full-text search index;
    // large payloads in File Storage are intentionally not indexed. lastStatusCode and
    // lastErrorMessage are denormalized from the most recent delivery attempt so the dashboard
    // can filter by delivery outcome without joining deliveryAttempts.
    searchText: v.optional(v.string()),
    lastStatusCode: v.optional(v.number()),
    lastErrorMessage: v.optional(v.string()),
  })
    .index('by_source_received', ['sourceId', 'receivedAt'])
    .index('by_dedup_key', ['sourceId', 'providerEventId'])
    .index('by_status_scheduled', ['status', 'nextAttemptAt'])
    .index('by_workspace_received', ['workspaceId', 'receivedAt'])
    .searchIndex('search_text', {
      searchField: 'searchText',
      filterFields: ['workspaceId', 'sourceId', 'status', 'eventType', 'lastStatusCode'],
    }),

  deliveryAttempts: defineTable({
    eventId: v.id('events'),
    attemptNumber: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    statusCode: v.optional(v.number()),
    responseBodyTruncated: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  }).index('by_event', ['eventId']),

  usageCounters: defineTable({
    workspaceId: v.id('workspaces'),
    billingPeriod: v.string(),
    eventCount: v.number(),
  }).index('by_workspace_period', ['workspaceId', 'billingPeriod']),

  // Per-source hourly delivery rollup (P3 observability). One row per (sourceId, hourBucket),
  // upserted incrementally from every recorded delivery attempt — never by scanning
  // deliveryAttempts, which does not scale at Indie volume (~250K events/mo). hourBucket is the
  // attempt's completion time floored to the hour (epoch ms). latencyBuckets holds counts per
  // fixed latency edge (see lib/deliveryStats), from which approximate p50/p95 are derived at
  // read time. statusCounts maps HTTP status code (or "error" for transport failures) to a count.
  deliveryStatsHourly: defineTable({
    workspaceId: v.id('workspaces'),
    sourceId: v.id('sources'),
    hourBucket: v.number(),
    attempts: v.number(),
    succeeded: v.number(),
    failed: v.number(),
    deadLettered: v.number(),
    statusCounts: v.record(v.string(), v.number()),
    latencyBuckets: v.array(v.number()),
  })
    .index('by_source_hour', ['sourceId', 'hourBucket'])
    .index('by_workspace_hour', ['workspaceId', 'hourBucket']),

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
