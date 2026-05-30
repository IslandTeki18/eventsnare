import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { QueryCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { requireRole } from './rbac';

const statusValidator = v.union(v.literal('draft'), v.literal('published'));

async function getCurrentAdminOrNull(ctx: QueryCtx): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query('users')
    .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();
  if (!user) return null;
  const assignment = await ctx.db
    .query('userRoles')
    .withIndex('byUserAndRole', (q) =>
      q.eq('userId', user._id).eq('roleName', 'admin'),
    )
    .unique();
  return assignment ? user : null;
}

async function withCoverUrl(ctx: QueryCtx, post: Doc<'blogPosts'>) {
  const coverImageUrl = post.coverImageStorageId
    ? await ctx.storage.getUrl(post.coverImageStorageId)
    : null;
  return { ...post, coverImageUrl };
}

export const listPublished = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const posts = await ctx.db
      .query('blogPosts')
      .withIndex('byStatusAndPublishedAt', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(limit ?? 50);
    return Promise.all(
      posts.map(async (post) => {
        const coverImageUrl = post.coverImageStorageId
          ? await ctx.storage.getUrl(post.coverImageStorageId)
          : null;
        return {
          _id: post._id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? null,
          coverImageUrl,
          publishedAt: post.publishedAt ?? null,
        };
      }),
    );
  },
});

export const getPublishedBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const post = await ctx.db
      .query('blogPosts')
      .withIndex('bySlug', (q) => q.eq('slug', slug))
      .unique();
    if (!post || post.status !== 'published') return null;
    return withCoverUrl(ctx, post);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getCurrentAdminOrNull(ctx);
    if (!admin) return [];
    const posts = await ctx.db
      .query('blogPosts')
      .withIndex('byCreatedAt')
      .order('desc')
      .collect();
    return Promise.all(posts.map((post) => withCoverUrl(ctx, post)));
  },
});

export const getById = query({
  args: { postId: v.id('blogPosts') },
  handler: async (ctx, { postId }) => {
    const admin = await getCurrentAdminOrNull(ctx);
    if (!admin) return null;
    const post = await ctx.db.get(postId);
    if (!post) return null;
    return withCoverUrl(ctx, post);
  },
});

async function assertSlugAvailable(
  ctx: QueryCtx,
  slug: string,
  excludePostId?: Doc<'blogPosts'>['_id'],
): Promise<void> {
  const existing = await ctx.db
    .query('blogPosts')
    .withIndex('bySlug', (q) => q.eq('slug', slug))
    .unique();
  if (existing && existing._id !== excludePostId) {
    throw new Error(`A post with slug "${slug}" already exists`);
  }
}

export const createPost = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    contentMarkdown: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, 'admin');
    await assertSlugAvailable(ctx, args.slug);
    const now = Date.now();
    return await ctx.db.insert('blogPosts', {
      authorId: admin._id,
      title: args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      contentMarkdown: args.contentMarkdown,
      status: args.status,
      publishedAt: args.status === 'published' ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePost = mutation({
  args: {
    postId: v.id('blogPosts'),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    contentMarkdown: v.optional(v.string()),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, { postId, ...updates }) => {
    await requireRole(ctx, 'admin');
    const post = await ctx.db.get(postId);
    if (!post) throw new Error('Post not found');

    if (updates.slug && updates.slug !== post.slug) {
      await assertSlugAvailable(ctx, updates.slug, postId);
    }

    const patch: Partial<Doc<'blogPosts'>> = { ...updates, updatedAt: Date.now() };
    if (updates.status === 'published' && !post.publishedAt) {
      patch.publishedAt = Date.now();
    }

    await ctx.db.patch(postId, patch);
    return postId;
  },
});

export const deletePost = mutation({
  args: { postId: v.id('blogPosts') },
  handler: async (ctx, { postId }) => {
    await requireRole(ctx, 'admin');
    const post = await ctx.db.get(postId);
    if (!post) return;
    if (post.coverImageStorageId) {
      await ctx.storage.delete(post.coverImageStorageId);
    }
    await ctx.db.delete(postId);
  },
});

export const generateCoverUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, 'admin');
    return await ctx.storage.generateUploadUrl();
  },
});

export const setCoverImage = mutation({
  args: { postId: v.id('blogPosts'), storageId: v.id('_storage') },
  handler: async (ctx, { postId, storageId }) => {
    await requireRole(ctx, 'admin');
    const post = await ctx.db.get(postId);
    if (!post) throw new Error('Post not found');
    if (post.coverImageStorageId && post.coverImageStorageId !== storageId) {
      await ctx.storage.delete(post.coverImageStorageId);
    }
    await ctx.db.patch(postId, {
      coverImageStorageId: storageId,
      updatedAt: Date.now(),
    });
  },
});
