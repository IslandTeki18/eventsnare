// CLI device-token lifecycle (P5). The dashboard mints, lists, and revokes tokens; the CLI never
// touches these functions. Generation hashes the raw token inside an action (crypto), then
// delegates persistence to an internal mutation that resolves the workspace from the Clerk
// identity the same way every other dashboard surface does. The raw token is returned exactly
// once and never stored.

import { v } from 'convex/values';
import { action, mutation, query, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { generateCliToken, hashCliToken } from './lib/cliAuth';
import { consumeRateLimit } from './lib/rateLimit';
import { requireUser } from './lib/auth';
import { requireWorkspace } from './workspaces';

// A compromised dashboard session should not be able to mint tokens in a loop.
const ISSUE_LIMIT = 10;
const ISSUE_WINDOW_MS = 3_600_000; // 1 hour

export const issueToken = action({
  args: { name: v.string() },
  handler: async (ctx, { name }): Promise<{ token: string; prefix: string }> => {
    const { token, prefix } = generateCliToken();
    const tokenHash = await hashCliToken(token);
    await ctx.runMutation(internal.cliTokens.insertToken, { name, tokenHash, prefix });
    return { token, prefix };
  },
});

export const insertToken = internalMutation({
  args: { name: v.string(), tokenHash: v.string(), prefix: v.string() },
  handler: async (ctx, { name, tokenHash, prefix }): Promise<void> => {
    const workspace = await requireWorkspace(ctx);
    const user = await requireUser(ctx);

    const allowed = await consumeRateLimit(
      ctx,
      `cli:token:issue:${workspace._id}`,
      ISSUE_LIMIT,
      ISSUE_WINDOW_MS,
      Date.now(),
    );
    if (!allowed) {
      throw new Error('Too many tokens minted recently. Try again in an hour.');
    }

    const tokenId = await ctx.db.insert('cliTokens', {
      workspaceId: workspace._id,
      userId: user._id,
      name: name.trim() || 'CLI token',
      tokenHash,
      prefix,
      createdAt: Date.now(),
    });

    await ctx.db.insert('activityLogs', {
      actorUserId: user._id,
      action: 'cli.token.issue',
      targetType: 'cliToken',
      targetId: tokenId,
      createdAt: Date.now(),
    });
  },
});

export const listTokens = query({
  args: {},
  handler: async (ctx) => {
    const workspace = await requireWorkspace(ctx);
    const tokens = await ctx.db
      .query('cliTokens')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspace._id))
      .order('desc')
      .collect();
    // Never expose tokenHash.
    return tokens.map((t) => ({
      _id: t._id,
      name: t.name,
      prefix: t.prefix,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt ?? null,
      revokedAt: t.revokedAt ?? null,
    }));
  },
});

export const revokeToken = mutation({
  args: { tokenId: v.id('cliTokens') },
  handler: async (ctx, { tokenId }): Promise<void> => {
    const workspace = await requireWorkspace(ctx);
    const user = await requireUser(ctx);
    const token = await ctx.db.get(tokenId);
    if (!token || token.workspaceId !== workspace._id) throw new Error('Token not found');

    if (!token.revokedAt) {
      await ctx.db.patch(tokenId, { revokedAt: Date.now() });
    }

    // End any live listen sessions immediately so pending() stops returning work.
    const sessions = await ctx.db
      .query('cliSessions')
      .withIndex('by_token', (q) => q.eq('tokenId', tokenId))
      .collect();
    for (const session of sessions) {
      if (session.status === 'active') {
        await ctx.db.patch(session._id, { status: 'ended', endedAt: Date.now() });
      }
    }

    await ctx.db.insert('activityLogs', {
      actorUserId: user._id,
      action: 'cli.token.revoke',
      targetType: 'cliToken',
      targetId: tokenId,
      createdAt: Date.now(),
    });
  },
});
