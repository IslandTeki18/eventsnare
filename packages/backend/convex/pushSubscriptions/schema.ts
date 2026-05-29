import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const pushSubscriptionsTables = {
  pushSubscriptions: defineTable({
    userId: v.id('users'),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('byUserId', ['userId'])
    .index('byEndpoint', ['endpoint']),
};

export default pushSubscriptionsTables;
