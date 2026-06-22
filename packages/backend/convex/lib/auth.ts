// Shared auth resolution. Several feature modules repeat the same
// identity -> users-row lookup; centralize it so authorization scoping stays consistent.

import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';

type Ctx = QueryCtx | MutationCtx;

export async function getCurrentUser(ctx: Ctx): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query('users')
    .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();
}

export async function requireUser(ctx: Ctx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');
  const user = await ctx.db
    .query('users')
    .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();
  if (!user) throw new Error('User record not yet synced from Clerk');
  return user;
}
