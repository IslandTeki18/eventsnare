import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { getCurrentUser, requireUser } from './lib/auth';

function findSetting(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  key: string,
) {
  return ctx.db
    .query('userSettings')
    .withIndex('byUserAndKey', (q) => q.eq('userId', userId).eq('key', key))
    .unique();
}

export const getMySettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [] as Array<{ key: string; value: string }>;
    const rows = await ctx.db
      .query('userSettings')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .collect();
    return rows.map((row) => ({ key: row.key, value: row.value }));
  },
});

export const getMySetting = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const row = await findSetting(ctx, user._id, key);
    return row?.value ?? null;
  },
});

export const setMySetting = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const user = await requireUser(ctx);
    const existing = await findSetting(ctx, user._id, key);
    if (existing) {
      await ctx.db.patch(existing._id, { value });
      return existing._id;
    }
    return await ctx.db.insert('userSettings', { userId: user._id, key, value });
  },
});

export const unsetMySetting = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const user = await requireUser(ctx);
    const existing = await findSetting(ctx, user._id, key);
    if (existing) await ctx.db.delete(existing._id);
  },
});
