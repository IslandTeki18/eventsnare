import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const adminTables = {
  activityLogs: defineTable({
    actorUserId: v.id('users'),
    action: v.string(),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('byCreatedAt', ['createdAt'])
    .index('byActor', ['actorUserId']),
  userBans: defineTable({
    userId: v.id('users'),
    bannedAt: v.number(),
    bannedBy: v.id('users'),
  }).index('byUserId', ['userId']),
};

export default adminTables;
