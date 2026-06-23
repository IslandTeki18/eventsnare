import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { requireUser } from './lib/auth';

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  roleName: string,
): Promise<Doc<'users'>> {
  const user = await requireUser(ctx);
  const assignment = await ctx.db
    .query('userRoles')
    .withIndex('byUserAndRole', (q) =>
      q.eq('userId', user._id).eq('roleName', roleName),
    )
    .unique();
  if (!assignment) {
    throw new Error(`Forbidden: requires role "${roleName}"`);
  }
  return user;
}
