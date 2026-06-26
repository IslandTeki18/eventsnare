import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// Write-only security audit trail. Populated by sensitive operations
// (CLI token issue/revoke, outbound secret reveal). No in-app reader today;
// add an index when one lands.
export const auditTables = {
  activityLogs: defineTable({
    actorUserId: v.id('users'),
    action: v.string(),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }),
};

export default auditTables;
