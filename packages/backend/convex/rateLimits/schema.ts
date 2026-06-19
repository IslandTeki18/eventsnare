import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// Generic fixed-window rate-limit counters. One row per (logical key, time bucket). Consumed
// via lib/rateLimit.ts. Stale rows from past windows are harmless and can be swept by a cron
// later (no sweep is wired yet).
export const rateLimitsTables = {
  rateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    windowStartMs: v.number(),
  }).index('by_key', ['key']),
};

export default rateLimitsTables;
