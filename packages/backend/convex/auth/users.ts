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
    if (existing) await ctx.db.delete(existing._id);
  },
});
