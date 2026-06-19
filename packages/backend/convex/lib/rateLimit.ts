import type { MutationCtx } from '../_generated/server';

// Generic fixed-window rate limiter backed by the rateLimits table. Mirrors the bucketed
// counter pattern used for failure-burst alerts (alerts/dispatch.bumpFailBurst): the current
// time bucket is derived from now/windowMs, and each logical key gets one counter row per
// bucket. Returns true if the call is allowed (and consumes one unit), false if the limit for
// the current window is already reached. Must run inside a mutation (it writes).
export async function consumeRateLimit(
  ctx: MutationCtx,
  key: string,
  limit: number,
  windowMs: number,
  nowMs: number,
): Promise<boolean> {
  const bucket = Math.floor(nowMs / windowMs);
  const rowKey = `${key}:${bucket}`;
  const existing = await ctx.db
    .query('rateLimits')
    .withIndex('by_key', (q) => q.eq('key', rowKey))
    .first();
  if (!existing) {
    await ctx.db.insert('rateLimits', { key: rowKey, count: 1, windowStartMs: bucket * windowMs });
    return true;
  }
  if (existing.count >= limit) return false;
  await ctx.db.patch(existing._id, { count: existing.count + 1 });
  return true;
}
