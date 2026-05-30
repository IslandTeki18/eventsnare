import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const blogTables = {
  blogPosts: defineTable({
    authorId: v.id('users'),
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    contentMarkdown: v.string(),
    coverImageStorageId: v.optional(v.id('_storage')),
    status: v.union(v.literal('draft'), v.literal('published')),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('bySlug', ['slug'])
    .index('byStatusAndPublishedAt', ['status', 'publishedAt'])
    .index('byCreatedAt', ['createdAt']),
};

export default blogTables;
