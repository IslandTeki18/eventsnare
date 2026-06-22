// CLI device-token + local-forwarding tables (P5). The `eventsnare listen` CLI authenticates
// with a long-lived device token (cliTokens), opens a listen session bound to one source
// (cliSessions), and drains a per-session queue of webhooks to forward to localhost
// (localDeliveries).
//
// Security: tokens are stored only as a SHA-256 hash (tokenHash) — the raw token is shown once
// at mint time and never persisted. A session also holds a random `secret`; the CLI must present
// (sessionId, secret) on every subsequent call, so a guessed document id alone grants nothing.
// localDeliveries.headersJson carries the FINAL outgoing header map already built by the delivery
// action (including the computed X-Eventsnare-Signature and any decrypted custom forward headers).
// That is acceptable: the rows are workspace-scoped, short-lived (TTL-swept in crons), and relay
// only the customer's own headers to the customer's own machine. The raw signing secret and the
// encryption key never appear here.

import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const cliAuthTables = {
  cliTokens: defineTable({
    workspaceId: v.id('workspaces'),
    userId: v.id('users'),
    name: v.string(),
    tokenHash: v.string(),
    prefix: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index('by_hash', ['tokenHash'])
    .index('by_workspace', ['workspaceId']),

  cliSessions: defineTable({
    tokenId: v.id('cliTokens'),
    workspaceId: v.id('workspaces'),
    sourceId: v.id('sources'),
    secret: v.string(),
    status: v.union(v.literal('active'), v.literal('ended')),
    startedAt: v.number(),
    lastSeenAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index('by_source_status', ['sourceId', 'status'])
    .index('by_token', ['tokenId']),

  localDeliveries: defineTable({
    eventId: v.id('events'),
    sourceId: v.id('sources'),
    workspaceId: v.id('workspaces'),
    sessionId: v.id('cliSessions'),
    status: v.union(
      v.literal('pending'),
      v.literal('claimed'),
      v.literal('done'),
      v.literal('failed'),
      v.literal('expired'),
    ),
    attemptNumber: v.number(),
    headersJson: v.string(),
    createdAt: v.number(),
    claimedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    statusCode: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index('by_source_status', ['sourceId', 'status'])
    .index('by_session_status', ['sessionId', 'status'])
    .index('by_event', ['eventId']),
};

export default cliAuthTables;
