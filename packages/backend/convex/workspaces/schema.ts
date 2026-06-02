// Workspace tables. A workspace is the tenant boundary in v1: one owner, one workspace
// per user at signup (SPEC FR-AUTH-2). Sources, events, and usage counters all hang off a
// workspace. `slug` is the public path segment in the ingress URL
// (https://hooks.eventsnare.dev/in/{slug}/{sourceId}) and is unique across the system.

import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const workspacesTables = {
  workspaces: defineTable({
    ownerUserId: v.id('users'),
    slug: v.string(),
    name: v.string(),
    plan: v.string(),
    createdAt: v.number(),
  })
    .index('by_owner', ['ownerUserId'])
    .index('by_slug', ['slug']),
};

export default workspacesTables;
