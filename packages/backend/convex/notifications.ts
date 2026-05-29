import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';

const DEFAULT_LIMIT = 25;

export const listMyRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query('notifications')
      .withIndex('byUserCreatedAt', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(limit ?? DEFAULT_LIMIT);
  },
});

export const getMyUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) return 0;
    const rows = await ctx.db
      .query('notifications')
      .withIndex('byUserUnread', (q) => q.eq('userId', user._id).eq('readAt', undefined))
      .collect();
    return rows.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, { notificationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) throw new Error('User record not yet synced from Clerk');
    const notification = await ctx.db.get(notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error('Notification not found');
    }
    if (notification.readAt === undefined) {
      await ctx.db.patch(notificationId, { readAt: Date.now() });
    }
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) return;
    const unread = await ctx.db
      .query('notifications')
      .withIndex('byUserUnread', (q) => q.eq('userId', user._id).eq('readAt', undefined))
      .collect();
    const now = Date.now();
    for (const row of unread) {
      await ctx.db.patch(row._id, { readAt: now });
    }
  },
});

export const createNotification = internalMutation({
  args: {
    userId: v.id('users'),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('notifications', {
      ...args,
      createdAt: Date.now(),
    });
  },
});
