import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getMySettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [] as Array<{ key: string; value: string }>;
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) return [];
    const rows = await ctx.db
      .query('userSettings')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .collect();
    return rows.map((row) => ({ key: row.key, value: row.value }));
  },
});

export const getMySetting = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) return null;
    const row = await ctx.db
      .query('userSettings')
      .withIndex('byUserAndKey', (q) => q.eq('userId', user._id).eq('key', key))
      .unique();
    return row?.value ?? null;
  },
});

export const setMySetting = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) throw new Error('User record not yet synced from Clerk');
    const existing = await ctx.db
      .query('userSettings')
      .withIndex('byUserAndKey', (q) => q.eq('userId', user._id).eq('key', key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value });
      return existing._id;
    }
    return await ctx.db.insert('userSettings', { userId: user._id, key, value });
  },
});

export const unsetMySetting = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) return;
    const existing = await ctx.db
      .query('userSettings')
      .withIndex('byUserAndKey', (q) => q.eq('userId', user._id).eq('key', key))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
