// Workspace provisioning and lookup. One workspace per user in v1 (SPEC FR-AUTH-2).
// The dashboard calls ensureForCurrentUser on mount; everything else reads getCurrent.

import { mutation, query } from './_generated/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { getCurrentUser, requireUser } from './lib/auth';

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'workspace'
  );
}

// The current user's workspace, scoped to the authenticated identity. Shared by source
// and event modules so authorization is resolved one way everywhere.
export async function getCurrentWorkspace(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'workspaces'> | null> {
  const user = await getCurrentUser(ctx);
  if (!user) return null;
  return await ctx.db
    .query('workspaces')
    .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
    .first();
}

export async function requireWorkspace(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'workspaces'>> {
  const workspace = await getCurrentWorkspace(ctx);
  if (!workspace) throw new Error('No workspace for current user');
  return workspace;
}

export const getCurrent = query({
  args: {},
  handler: async (ctx) => getCurrentWorkspace(ctx),
});

export const ensureForCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query('workspaces')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
      .first();
    if (existing) return existing;

    // Deterministic, collision-free slug: human-readable base plus a suffix derived from
    // the user's unique id (mutations cannot use Math.random).
    const base = slugify(user.name ?? user.email.split('@')[0] ?? 'workspace');
    const suffix = user._id.slice(-6).toLowerCase().replace(/[^a-z0-9]/g, '');
    const slug = `${base}-${suffix}`;

    const workspaceId = await ctx.db.insert('workspaces', {
      ownerUserId: user._id,
      slug,
      name: user.name ?? `${user.email.split('@')[0]}'s workspace`,
      plan: 'free',
      createdAt: Date.now(),
    });
    return await ctx.db.get(workspaceId);
  },
});
