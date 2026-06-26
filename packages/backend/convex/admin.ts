import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './rbac';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const listUsersWithRoles = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!me) return [];
    const myRoles = await ctx.db
      .query('userRoles')
      .withIndex('byUserId', (q) => q.eq('userId', me._id))
      .collect();
    if (!myRoles.some((r) => r.roleName === 'admin')) return [];

    const users = await ctx.db.query('users').collect();
    return await Promise.all(
      users.map(async (user) => {
        const roleAssignments = await ctx.db
          .query('userRoles')
          .withIndex('byUserId', (q) => q.eq('userId', user._id))
          .collect();
        return {
          user: {
            _id: user._id,
            clerkId: user.clerkId,
            email: user.email,
            name: user.name,
            imageUrl: user.imageUrl,
          },
          roles: roleAssignments.map((r) => r.roleName),
        };
      }),
    );
  },
});

export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const me = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!me) return null;
    const myRoles = await ctx.db
      .query('userRoles')
      .withIndex('byUserId', (q) => q.eq('userId', me._id))
      .collect();
    if (!myRoles.some((r) => r.roleName === 'admin')) return null;

    const users = await ctx.db.query('users').collect();
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const signupsLast7Days = users.filter((u) => u._creationTime >= cutoff).length;
    const allRoleAssignments = await ctx.db.query('userRoles').collect();
    const roleDistribution: Record<string, number> = {};
    for (const r of allRoleAssignments) {
      roleDistribution[r.roleName] = (roleDistribution[r.roleName] ?? 0) + 1;
    }
    return {
      totalUsers: users.length,
      signupsLast7Days,
      roleDistribution,
    };
  },
});

export const setUserRole = mutation({
  args: { userId: v.id('users'), roleName: v.string() },
  handler: async (ctx, { userId, roleName }) => {
    await requireRole(ctx, 'admin');
    const existing = await ctx.db
      .query('userRoles')
      .withIndex('byUserAndRole', (q) => q.eq('userId', userId).eq('roleName', roleName))
      .unique();
    if (!existing) {
      await ctx.db.insert('userRoles', { userId, roleName });
    }
  },
});

export const unsetUserRole = mutation({
  args: { userId: v.id('users'), roleName: v.string() },
  handler: async (ctx, { userId, roleName }) => {
    await requireRole(ctx, 'admin');
    const existing = await ctx.db
      .query('userRoles')
      .withIndex('byUserAndRole', (q) => q.eq('userId', userId).eq('roleName', roleName))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
