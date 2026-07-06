import type { QueryCtx, MutationCtx } from './_generated/server';
import { query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { requireUser, getCurrentUser } from './lib/auth';

export const getMyRoles = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { roles: [], permissions: [] };

    const assignments = await ctx.db
      .query('userRoles')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .collect();
    const roles = assignments.map((a) => a.roleName);

    const permissions = new Set<string>();
    for (const roleName of roles) {
      const role = await ctx.db
        .query('roles')
        .withIndex('byName', (q) => q.eq('name', roleName))
        .unique();
      role?.permissions.forEach((p) => permissions.add(p));
    }

    return { roles, permissions: [...permissions] };
  },
});

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
