import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { getCurrentUser, requireUser } from './lib/auth';

const DEFAULT_LIMIT = 25;

export const listMyRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const user = await getCurrentUser(ctx);
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
    const user = await getCurrentUser(ctx);
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
    const user = await requireUser(ctx);
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
    const user = await requireUser(ctx);
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

// Fan an alert out to the workspace owner's in-app inbox. One owner per workspace in v1.
export const notifyWorkspaceOwner = internalMutation({
  args: {
    workspaceId: v.id('workspaces'),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceId, type, title, body }) => {
    const ws = await ctx.db.get(workspaceId);
    if (!ws) return;
    await ctx.db.insert('notifications', {
      userId: ws.ownerUserId,
      type,
      title,
      body,
      createdAt: Date.now(),
    });
  },
});
