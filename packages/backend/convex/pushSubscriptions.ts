import { v } from 'convex/values';
import type { MutationCtx } from './_generated/server';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { getCurrentUser } from './lib/auth';

const keysValidator = v.object({
  p256dh: v.string(),
  auth: v.string(),
});

/**
 * Resolve the caller's user row, creating it on first write if the Clerk
 * webhook has not synced it yet (just-in-time provisioning). Mirrors the
 * webhook's `email ?? ''` fallback so no schema change is needed. Throws a
 * distinct error when there is no Convex auth identity at all, which points
 * at a missing Clerk JWT template named "convex" rather than a missing row.
 */
async function getOrCreateUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error(
      'No Convex auth identity. Ensure a Clerk JWT template named "convex" exists and that you are signed in.',
    );
  }
  const existing = await ctx.db
    .query('users')
    .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();
  if (existing) return existing;

  const userId = await ctx.db.insert('users', {
    clerkId: identity.subject,
    email: identity.email ?? '',
    name: identity.name,
    imageUrl: identity.pictureUrl,
  });
  const created = await ctx.db.get(userId);
  if (!created) throw new Error('Failed to create user record');
  return created;
}

/**
 * Upsert a push subscription for the current user, keyed by endpoint.
 * The browser may hand back the same endpoint across sessions, so we patch
 * rather than create duplicates.
 */
export const saveSubscription = mutation({
  args: {
    endpoint: v.string(),
    keys: keysValidator,
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { endpoint, keys, userAgent }) => {
    const user = await getOrCreateUser(ctx);

    const existing = await ctx.db
      .query('pushSubscriptions')
      .withIndex('byEndpoint', (q) => q.eq('endpoint', endpoint))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { userId: user._id, keys, userAgent });
      return existing._id;
    }

    return await ctx.db.insert('pushSubscriptions', {
      userId: user._id,
      endpoint,
      keys,
      userAgent,
      createdAt: Date.now(),
    });
  },
});

/** Remove the caller's subscription for a given endpoint (on disable). */
export const deleteSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    const row = await ctx.db
      .query('pushSubscriptions')
      .withIndex('byEndpoint', (q) => q.eq('endpoint', endpoint))
      .unique();
    if (row && row.userId === user._id) {
      await ctx.db.delete(row._id);
    }
  },
});

/** Number of active subscriptions for the current user (drives the UI). */
export const getMySubscriptionCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;
    const rows = await ctx.db
      .query('pushSubscriptions')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .collect();
    return rows.length;
  },
});

/**
 * Full subscription rows (including encryption keys) for the current user.
 * Internal — only the sendTestPush action consumes this. Auth identity is
 * propagated when called via ctx.runQuery from the action.
 */
export const listMineWithKeys = internalQuery({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query('pushSubscriptions')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .collect();
  },
});

/** Internal cleanup used by the action when a push service reports a dead endpoint. */
export const deleteByEndpoint = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const row = await ctx.db
      .query('pushSubscriptions')
      .withIndex('byEndpoint', (q) => q.eq('endpoint', endpoint))
      .unique();
    if (row) await ctx.db.delete(row._id);
  },
});
