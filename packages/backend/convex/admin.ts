import { v } from 'convex/values';
import { internalMutation, mutation, query } from '../_generated/server';
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
        const ban = await ctx.db
          .query('userBans')
          .withIndex('byUserId', (q) => q.eq('userId', user._id))
          .unique();
        return {
          user: {
            _id: user._id,
            clerkId: user.clerkId,
            email: user.email,
            name: user.name,
            imageUrl: user.imageUrl,
          },
          roles: roleAssignments.map((r) => r.roleName),
          isBanned: ban !== null,
          bannedAt: ban?.bannedAt ?? null,
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

export const listRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
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

    const entries = await ctx.db
      .query('activityLogs')
      .withIndex('byCreatedAt')
      .order('desc')
      .take(limit ?? 50);
    return await Promise.all(
      entries.map(async (entry) => {
        const actor = await ctx.db.get(entry.actorUserId);
        return {
          ...entry,
          actorName: actor?.name ?? actor?.email ?? 'Unknown',
        };
      }),
    );
  },
});

export const getSystemStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      convexDeploymentUrl: process.env.CONVEX_CLOUD_URL ?? process.env.CONVEX_SITE_URL ?? 'unknown',
      uptime: 'online',
      checkedAt: Date.now(),
    };
  },
});

export const setUserRole = mutation({
  args: { userId: v.id('users'), roleName: v.string() },
  handler: async (ctx, { userId, roleName }) => {
    const me = await requireRole(ctx, 'admin');
    const existing = await ctx.db
      .query('userRoles')
      .withIndex('byUserAndRole', (q) => q.eq('userId', userId).eq('roleName', roleName))
      .unique();
    if (!existing) {
      await ctx.db.insert('userRoles', { userId, roleName });
    }
    await ctx.db.insert('activityLogs', {
      actorUserId: me._id,
      action: 'role.assign',
      targetType: 'user',
      targetId: userId,
      metadata: { roleName },
      createdAt: Date.now(),
    });
  },
});

export const unsetUserRole = mutation({
  args: { userId: v.id('users'), roleName: v.string() },
  handler: async (ctx, { userId, roleName }) => {
    const me = await requireRole(ctx, 'admin');
    const existing = await ctx.db
      .query('userRoles')
      .withIndex('byUserAndRole', (q) => q.eq('userId', userId).eq('roleName', roleName))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    await ctx.db.insert('activityLogs', {
      actorUserId: me._id,
      action: 'role.revoke',
      targetType: 'user',
      targetId: userId,
      metadata: { roleName },
      createdAt: Date.now(),
    });
  },
});

export const recordActivity = internalMutation({
  args: {
    actorUserId: v.id('users'),
    action: v.string(),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('activityLogs', {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const markBanned = internalMutation({
  args: { userId: v.id('users'), bannedBy: v.id('users') },
  handler: async (ctx, { userId, bannedBy }) => {
    const existing = await ctx.db
      .query('userBans')
      .withIndex('byUserId', (q) => q.eq('userId', userId))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert('userBans', {
      userId,
      bannedBy,
      bannedAt: Date.now(),
    });
  },
});

export const markUnbanned = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query('userBans')
      .withIndex('byUserId', (q) => q.eq('userId', userId))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const getUserClerkId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
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
    const user = await ctx.db.get(userId);
    return user ? { clerkId: user.clerkId, adminUserId: me._id } : null;
  },
});
