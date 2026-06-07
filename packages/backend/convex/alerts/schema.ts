// Alerting domain tables (SPEC §4.6, §8).
//
// `alerts` is per-workspace channel configuration: for each alert type the customer chooses
// whether an email and/or Slack channel is enabled and where to send it. `alertState` is a
// lightweight idempotency/anti-spam ledger so a given alert (a dead-lettered event, a crossed
// quota threshold, a failure burst window) fires at most once. Keys are deterministic strings
// claimed atomically inside a mutation; see alerts/dispatch.ts.

import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const alertsTables = {
  alerts: defineTable({
    workspaceId: v.id('workspaces'),
    type: v.union(
      v.literal('delivery_failure'),
      v.literal('dead_letter'),
      v.literal('quota'),
    ),
    channel: v.union(v.literal('email'), v.literal('slack')),
    enabled: v.boolean(),
    target: v.string(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_workspace_type', ['workspaceId', 'type']),

  // Idempotency ledger. `key` encodes what fired (e.g. `quota:2026-06:80`,
  // `deadletter:<eventId>`, `failburst:<sourceId>:<5minBucket>`). For failure bursts the row
  // doubles as a rolling counter via `count`.
  alertState: defineTable({
    workspaceId: v.id('workspaces'),
    key: v.string(),
    firedAt: v.number(),
    count: v.optional(v.number()),
  }).index('by_workspace_key', ['workspaceId', 'key']),
};

export default alertsTables;
