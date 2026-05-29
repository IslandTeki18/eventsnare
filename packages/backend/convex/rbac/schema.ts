import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const rbacTables = {
  roles: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
  }).index('byName', ['name']),
  userRoles: defineTable({
    userId: v.id('users'),
    roleName: v.string(),
  })
    .index('byUserId', ['userId'])
    .index('byUserAndRole', ['userId', 'roleName']),
};

export default rbacTables;
