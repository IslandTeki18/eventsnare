import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const userProfileTables = {
  userProfiles: defineTable({
    userId: v.id('users'),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    joinedAt: v.number(),
  }).index('byUserId', ['userId']),
};

export default userProfileTables;
