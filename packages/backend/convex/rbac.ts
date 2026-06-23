import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { getCurrentUser, requireUser } from './lib/auth';

export const DEFAULT_ROLES: Array<{
  name: string;
  description: string;
  permissions: string[];
}> = [
  {
    name: 'admin',
    description: 'Full administrative access to all resources.',
    permissions: ['read:all', 'write:all', 'manage:users', 'manage:roles'],
  },
  {
    name: 'member',
    description: 'Standard authenticated user with read/write on own resources.',
    permissions: ['read:all', 'write:own'],
  },
  {
    name: 'viewer',
    description: 'Read-only access.',
    permissions: ['read:all'],
  },
];

function findAssignment(
  ctx: QueryCtx,
  userId: Id<'users'>,
  roleName: string,
) {
  return ctx.db
    .query('userRoles')
    .withIndex('byUserAndRole', (q) =>
      q.eq('userId', userId).eq('roleName', roleName),
    )
    .unique();
}

async function getRolesForUser(
  ctx: QueryCtx,
  userId: Id<'users'>,
): Promise<string[]> {
  const assignments = await ctx.db
    .query('userRoles')
    .withIndex('byUserId', (q) => q.eq('userId', userId))
    .collect();
  return assignments.map((a) => a.roleName);
}

async function getPermissionsForRoles(
  ctx: QueryCtx,
  roleNames: string[],
): Promise<string[]> {
  const out = new Set<string>();
  for (const name of roleNames) {
    const role = await ctx.db
      .query('roles')
      .withIndex('byName', (q) => q.eq('name', name))
      .unique();
    if (role) {
      for (const perm of role.permissions) out.add(perm);
    }
  }
  return Array.from(out);
}

async function seedRoles(ctx: MutationCtx): Promise<void> {
  for (const role of DEFAULT_ROLES) {
    const existing = await ctx.db
      .query('roles')
      .withIndex('byName', (q) => q.eq('name', role.name))
      .unique();
    if (!existing) {
      await ctx.db.insert('roles', role);
    }
  }
}

export const getMyRoles = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { roles: [] as string[], permissions: [] as string[] };
    const roles = await getRolesForUser(ctx, user._id);
    const permissions = await getPermissionsForRoles(ctx, roles);
    return { roles, permissions };
  },
});

export const userHasRole = query({
  args: { roleName: v.string() },
  handler: async (ctx, { roleName }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;
    return (await findAssignment(ctx, user._id, roleName)) !== null;
  },
});

export const userHasPermission = query({
  args: { permission: v.string() },
  handler: async (ctx, { permission }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;
    const roles = await getRolesForUser(ctx, user._id);
    const permissions = await getPermissionsForRoles(ctx, roles);
    return permissions.includes(permission);
  },
});

export const assignRole = internalMutation({
  args: { userId: v.id('users'), roleName: v.string() },
  handler: async (ctx, { userId, roleName }) => {
    const existing = await findAssignment(ctx, userId, roleName);
    if (existing) return existing._id;
    return await ctx.db.insert('userRoles', { userId, roleName });
  },
});

export const revokeRole = internalMutation({
  args: { userId: v.id('users'), roleName: v.string() },
  handler: async (ctx, { userId, roleName }) => {
    const existing = await findAssignment(ctx, userId, roleName);
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const seedDefaultRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    await seedRoles(ctx);
  },
});

export const seedDefaultRolesPublic = mutation({
  args: {},
  handler: async (ctx) => {
    await seedRoles(ctx);
  },
});

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  roleName: string,
): Promise<Doc<'users'>> {
  const user = await requireUser(ctx);
  const assignment = await findAssignment(ctx, user._id, roleName);
  if (!assignment) {
    throw new Error(`Forbidden: requires role "${roleName}"`);
  }
  return user;
}

export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  permission: string,
): Promise<Doc<'users'>> {
  const user = await requireUser(ctx);
  const roles = await getRolesForUser(ctx, user._id);
  const permissions = await getPermissionsForRoles(ctx, roles);
  if (permissions.includes(permission)) return user;
  throw new Error(`Forbidden: requires permission "${permission}"`);
}
