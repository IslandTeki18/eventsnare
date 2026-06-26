import { v } from 'convex/values';
import { internalMutation, query } from '../_generated/server';

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    return user;
  },
});

export const syncUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    phoneHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        // Only set when present: a later user.updated without a verified phone must not wipe it.
        ...(args.phoneHash ? { phoneHash: args.phoneHash } : {}),
      });
      return existing._id;
    }
    return await ctx.db.insert('users', args);
  },
});

export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!existing) return;

    // Roll lifetime event usage into the phone ledger before deleting, so the "events used"
    // warning survives account deletion. freeWorkspacesCreated is left as-is: it is the block
    // signal, and the ledger row is intentionally never deleted.
    if (existing.phoneHash) {
      const workspaces = await ctx.db
        .query('workspaces')
        .withIndex('by_owner', (q) => q.eq('ownerUserId', existing._id))
        .collect();
      let events = 0;
      for (const ws of workspaces) {
        const counters = await ctx.db
          .query('usageCounters')
          .withIndex('by_workspace_period', (q) => q.eq('workspaceId', ws._id))
          .collect();
        for (const c of counters) events += c.eventCount;
      }
      if (events > 0) {
        const ledger = await ctx.db
          .query('phoneLedger')
          .withIndex('byPhoneHash', (q) => q.eq('phoneHash', existing.phoneHash!))
          .unique();
        if (ledger) {
          await ctx.db.patch(ledger._id, {
            lifetimeEvents: ledger.lifetimeEvents + events,
          });
        }
      }
    }

    await ctx.db.delete(existing._id);
  },
});
