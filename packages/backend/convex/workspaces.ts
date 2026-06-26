// Workspace provisioning and lookup. One workspace per user in v1 (SPEC FR-AUTH-2).
// The dashboard calls ensureForCurrentUser on mount; everything else reads getCurrent.

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { getCurrentUser, requireUser } from './lib/auth';
import { isDisposableEmail } from './lib/disposableEmail';

// Result of provisioning the current user's free workspace. Anything other than `ok` is a
// gate the dashboard must render (the workspace was not created).
type EnsureResult =
  | { status: 'ok'; workspace: Doc<'workspaces'> }
  | { status: 'needs_phone' }
  | { status: 'free_tier_used'; lifetimeEvents: number }
  | { status: 'disposable_email' };

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

// Overage opt-in (SPEC FR-BILL-4). Records consent; Stripe metered enforcement is deferred.
export const setAllowOverages = mutation({
  args: { allowOverages: v.boolean() },
  handler: async (ctx, { allowOverages }) => {
    const workspace = await requireWorkspace(ctx);
    await ctx.db.patch(workspace._id, { allowOverages });
  },
});

export const ensureForCurrentUser = mutation({
  args: {},
  handler: async (ctx): Promise<EnsureResult> => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query('workspaces')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
      .first();
    if (existing) return { status: 'ok', workspace: existing };

    // Soft signal: block obvious throwaway-email providers. Phone is the real gate below.
    if (isDisposableEmail(user.email)) return { status: 'disposable_email' };

    // Verified-phone gate. phoneHash is set by the Clerk webhook once the verified phone lands;
    // refuse to provision before it arrives so the free tier is never granted unverified. Phone
    // is required at signup, so this resolves as soon as the webhook is processed.
    if (!user.phoneHash) return { status: 'needs_phone' };

    const ledger = await ctx.db
      .query('phoneLedger')
      .withIndex('byPhoneHash', (q) => q.eq('phoneHash', user.phoneHash!))
      .unique();

    // One verified phone gets one free tier, across re-signups and account deletions.
    if (ledger && ledger.freeWorkspacesCreated >= 1) {
      return { status: 'free_tier_used', lifetimeEvents: ledger.lifetimeEvents };
    }

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

    if (ledger) {
      await ctx.db.patch(ledger._id, {
        freeWorkspacesCreated: ledger.freeWorkspacesCreated + 1,
      });
    } else {
      await ctx.db.insert('phoneLedger', {
        phoneHash: user.phoneHash,
        firstSeenAt: Date.now(),
        freeWorkspacesCreated: 1,
        lifetimeEvents: 0,
      });
    }

    const workspace = await ctx.db.get(workspaceId);
    return { status: 'ok', workspace: workspace! };
  },
});
