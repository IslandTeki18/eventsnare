import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { getCurrentUser, requireUser } from './lib/auth';

function findProfile(ctx: QueryCtx | MutationCtx, userId: Id<'users'>) {
  return ctx.db
    .query('userProfiles')
    .withIndex('byUserId', (q) => q.eq('userId', userId))
    .unique();
}

async function resolveAvatarUrl(
  ctx: QueryCtx | MutationCtx,
  profile: { avatarStorageId?: Id<'_storage'> } | null,
) {
  return profile?.avatarStorageId
    ? await ctx.storage.getUrl(profile.avatarStorageId)
    : null;
}

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const profile = await findProfile(ctx, user._id);
    return { user, profile, avatarUrl: await resolveAvatarUrl(ctx, profile) };
  },
});

export const getProfileByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const profile = await findProfile(ctx, userId);
    return { user, profile, avatarUrl: await resolveAvatarUrl(ctx, profile) };
  },
});

export const upsertMyProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await findProfile(ctx, user._id);
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert('userProfiles', {
      userId: user._id,
      ...args,
      joinedAt: Date.now(),
    });
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const setMyAvatar = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    const user = await requireUser(ctx);
    const existing = await findProfile(ctx, user._id);
    if (existing) {
      if (existing.avatarStorageId && existing.avatarStorageId !== storageId) {
        await ctx.storage.delete(existing.avatarStorageId);
      }
      await ctx.db.patch(existing._id, { avatarStorageId: storageId });
      return existing._id;
    }
    return await ctx.db.insert('userProfiles', {
      userId: user._id,
      avatarStorageId: storageId,
      joinedAt: Date.now(),
    });
  },
});
