// Stress-test setup and teardown helpers.
//
// Kept separate from ingress.ts so the production hot path stays clean: nothing here runs
// in the measured ingress transaction. These functions provision fake sources, tear down
// all test data for a workspace, and record per-run parameters/results into stressTestRuns.
// All reads go through indexes (never .filter on a collection) so teardown of large runs
// does not degrade into full table scans.

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Deterministic fake whsec_ secret derived from the index — no Math.random needed and
// stable across runs for reproducibility. Length mirrors a real Stripe signing secret.
// The stress harness uses simulated delivery and never decrypts, so this fake value is
// stored verbatim in signingSecretEncrypted (no real AES round-trip in the load test).
function fakeSigningSecret(index: number): string {
  const seed = (index + 1) * 2654435761; // Knuth multiplicative hash
  let hex = '';
  let x = seed >>> 0;
  for (let i = 0; i < 24; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    hex += (x & 0xf).toString(16);
  }
  return `whsec_${hex}`;
}

// Provision a throwaway workspace (and its owning stress-test user) for a load run. Returns
// the workspace id the other helpers key off. Idempotent via the deterministic clerkId.
export const setupWorkspace = mutation({
  args: { label: v.string() },
  handler: async (ctx, { label }) => {
    const clerkId = `stress-test:${label}`;
    let user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', clerkId))
      .unique();
    if (!user) {
      const userId = await ctx.db.insert('users', {
        clerkId,
        email: `${label}@stress.test`,
        name: `Stress ${label}`,
      });
      user = await ctx.db.get(userId);
    }
    const slug = `stress-${label}`;
    let workspace = await ctx.db
      .query('workspaces')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first();
    if (!workspace) {
      const workspaceId = await ctx.db.insert('workspaces', {
        ownerUserId: user!._id,
        slug,
        name: `Stress ${label}`,
        plan: 'free',
        createdAt: Date.now(),
      });
      workspace = await ctx.db.get(workspaceId);
    }
    return workspace!._id;
  },
});

export const setupSources = mutation({
  args: { workspaceId: v.id('workspaces'), count: v.number() },
  handler: async (ctx, { workspaceId, count }) => {
    const ids = [];
    for (let i = 0; i < count; i++) {
      const id = await ctx.db.insert('sources', {
        workspaceId,
        provider: 'stripe',
        name: `stress-source-${i}`,
        forwardUrl: `https://example.test/hooks/${workspaceId}/${i}`,
        signingSecretEncrypted: fakeSigningSecret(i),
        status: 'active',
        maxRetries: 7,
        createdAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const teardownAll = mutation({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    let eventsDeleted = 0;
    let attemptsDeleted = 0;

    const events = await ctx.db
      .query('events')
      .withIndex('by_workspace_received', (q) => q.eq('workspaceId', workspaceId))
      .collect();
    for (const event of events) {
      const attempts = await ctx.db
        .query('deliveryAttempts')
        .withIndex('by_event', (q) => q.eq('eventId', event._id))
        .collect();
      for (const attempt of attempts) {
        await ctx.db.delete(attempt._id);
        attemptsDeleted++;
      }
      await ctx.db.delete(event._id);
      eventsDeleted++;
    }

    const sources = await ctx.db
      .query('sources')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();
    for (const source of sources) {
      await ctx.db.delete(source._id);
    }

    const counters = await ctx.db
      .query('usageCounters')
      .withIndex('by_workspace_period', (q) => q.eq('workspaceId', workspaceId))
      .collect();
    for (const counter of counters) {
      await ctx.db.delete(counter._id);
    }

    return {
      eventsDeleted,
      attemptsDeleted,
      sourcesDeleted: sources.length,
      countersDeleted: counters.length,
    };
  },
});

export const recordRunStart = mutation({
  args: {
    label: v.string(),
    startedAt: v.number(),
    targetEventsPerSecond: v.number(),
    targetDurationSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('stressTestRuns', {
      label: args.label,
      startedAt: args.startedAt,
      targetEventsPerSecond: args.targetEventsPerSecond,
      targetDurationSeconds: args.targetDurationSeconds,
      totalAttempted: 0,
      totalSucceeded: 0,
      totalFailed: 0,
    });
  },
});

export const recordRunResults = mutation({
  args: {
    runId: v.id('stressTestRuns'),
    completedAt: v.number(),
    totalAttempted: v.number(),
    totalSucceeded: v.number(),
    totalFailed: v.number(),
    p50LatencyMs: v.optional(v.number()),
    p95LatencyMs: v.optional(v.number()),
    p99LatencyMs: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { runId, ...patch }) => {
    await ctx.db.patch(runId, patch);
  },
});

export const getDeliveryStats = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    const events = await ctx.db
      .query('events')
      .withIndex('by_workspace_received', (q) => q.eq('workspaceId', workspaceId))
      .collect();

    const stats = {
      total: events.length,
      received: 0,
      delivering: 0,
      delivered: 0,
      failed: 0,
      deadLetter: 0,
    };
    for (const event of events) {
      stats[event.status]++;
    }
    return stats;
  },
});
