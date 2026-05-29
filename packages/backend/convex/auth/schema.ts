import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const authTables = {
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index('byClerkId', ['clerkId']),
};

export default authTables;
