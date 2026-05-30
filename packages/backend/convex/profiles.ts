import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) return null;
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .unique();
    const avatarUrl = profile?.avatarStorageId
      ? await ctx.storage.getUrl(profile.avatarStorageId)
      : null;
    return { user, profile, avatarUrl };
  },
});

export const getProfileByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('byUserId', (q) => q.eq('userId', userId))
      .unique();
    const avatarUrl = profile?.avatarStorageId
      ? await ctx.storage.getUrl(profile.avatarStorageId)
      : null;
    return { user, profile, avatarUrl };
  },
});

export const upsertMyProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) throw new Error('User record not yet synced from Clerk');
    const existing = await ctx.db
      .query('userProfiles')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .unique();
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    return await ctx.storage.generateUploadUrl();
  },
});

export const setMyAvatar = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) throw new Error('User record not yet synced from Clerk');
    const existing = await ctx.db
      .query('userProfiles')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .unique();
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
