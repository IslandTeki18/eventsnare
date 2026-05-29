import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const notificationsTables = {
  notifications: defineTable({
    userId: v.id('users'),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    data: v.optional(v.any()),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('byUserId', ['userId'])
    .index('byUserUnread', ['userId', 'readAt'])
    .index('byUserCreatedAt', ['userId', 'createdAt']),
};

export default notificationsTables;
