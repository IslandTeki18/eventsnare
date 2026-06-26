// CLI listen-session lifecycle (P5). These functions are called by the `eventsnare listen` CLI,
// which has no Clerk identity. Authentication is therefore by argument, not by ctx.auth:
//
//   - The three entry-point actions (validateToken, listSources, registerSession) hash the raw
//     device token and resolve it to a workspace via resolveContext.
//   - Every call after register presents (sessionId, secret); the secret is an unguessable
//     capability minted in registerSession, so a leaked/guessed document id alone is useless.
//
// Routing: findActiveSession is the hook delivery.attempt uses to decide whether a source's
// events go to a connected local listener instead of the production forward URL.

import { v } from 'convex/values';
import { action, internalMutation, internalQuery, mutation } from './_generated/server';
import type { ActionCtx, QueryCtx, MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { generateSessionSecret, hashCliToken } from './lib/cliAuth';

// A session is "active" for routing only while the CLI keeps heartbeating. Past this window the
// listener is presumed gone and events fall back to production delivery. The CLI heartbeats well
// inside this interval (~10s heartbeat vs 45s window).
export const SESSION_STALE_MS = 45_000;

interface TokenContext {
  tokenId: Id<'cliTokens'>;
  workspaceId: Id<'workspaces'>;
  workspaceSlug: string;
  workspaceName: string;
}

// Resolve an already-hashed token to its workspace context. Internal: the hashing happens in the
// calling action (crypto is action-only). Returns null for unknown or revoked tokens.
export const resolveContext = internalQuery({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }): Promise<TokenContext | null> => {
    const token = await ctx.db
      .query('cliTokens')
      .withIndex('by_hash', (q) => q.eq('tokenHash', tokenHash))
      .unique();
    if (!token || token.revokedAt) return null;
    const workspace = await ctx.db.get(token.workspaceId);
    if (!workspace) return null;
    return {
      tokenId: token._id,
      workspaceId: token.workspaceId,
      workspaceSlug: workspace.slug,
      workspaceName: workspace.name,
    };
  },
});

async function requireContext(ctx: ActionCtx, rawToken: string): Promise<TokenContext> {
  const tokenHash = await hashCliToken(rawToken);
  const context = await ctx.runQuery(internal.cliSessions.resolveContext, { tokenHash });
  if (!context) throw new Error('Invalid or revoked CLI token. Run `eventsnare login` again.');
  return context;
}

export const validateToken = action({
  args: { token: v.string() },
  handler: async (
    ctx,
    { token },
  ): Promise<{ workspaceSlug: string; workspaceName: string }> => {
    const context = await requireContext(ctx, token);
    return { workspaceSlug: context.workspaceSlug, workspaceName: context.workspaceName };
  },
});

export const sourcesForWorkspace = internalQuery({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    const sources = await ctx.db
      .query('sources')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
      .collect();
    return sources
      .filter((s) => !s.deletedAt && s.status !== 'deleted')
      .map((s) => ({ _id: s._id, name: s.name, provider: s.provider, status: s.status }));
  },
});

export const listSources = action({
  args: { token: v.string() },
  handler: async (
    ctx,
    { token },
  ): Promise<Pick<Doc<'sources'>, '_id' | 'name' | 'provider' | 'status'>[]> => {
    const context = await requireContext(ctx, token);
    return await ctx.runQuery(internal.cliSessions.sourcesForWorkspace, {
      workspaceId: context.workspaceId,
    });
  },
});

export const registerSession = action({
  args: { token: v.string(), sourceId: v.id('sources') },
  handler: async (
    ctx,
    { token, sourceId },
  ): Promise<{ sessionId: Id<'cliSessions'>; secret: string }> => {
    const context = await requireContext(ctx, token);
    const secret = generateSessionSecret();
    const sessionId = await ctx.runMutation(internal.cliSessions.openSession, {
      tokenId: context.tokenId,
      workspaceId: context.workspaceId,
      sourceId,
      secret,
    });
    return { sessionId, secret };
  },
});

export const openSession = internalMutation({
  args: {
    tokenId: v.id('cliTokens'),
    workspaceId: v.id('workspaces'),
    sourceId: v.id('sources'),
    secret: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'cliSessions'>> => {
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.workspaceId !== args.workspaceId || source.deletedAt) {
      throw new Error('Source not found');
    }

    // Replace semantics: the newest listener for a source wins. End any prior active session so
    // a single source never fans out to two listeners.
    const prior = await ctx.db
      .query('cliSessions')
      .withIndex('by_source_status', (q) => q.eq('sourceId', args.sourceId).eq('status', 'active'))
      .collect();
    for (const s of prior) {
      await ctx.db.patch(s._id, { status: 'ended', endedAt: Date.now() });
    }

    const now = Date.now();
    const sessionId = await ctx.db.insert('cliSessions', {
      tokenId: args.tokenId,
      workspaceId: args.workspaceId,
      sourceId: args.sourceId,
      secret: args.secret,
      status: 'active',
      startedAt: now,
      lastSeenAt: now,
    });
    await ctx.db.patch(args.tokenId, { lastUsedAt: now });
    return sessionId;
  },
});

// Load a session and verify the presented capability. Returns null (never throws) so callers can
// translate "session gone / wrong secret" into a clean CLI exit rather than an error.
export async function loadVerifiedSession(
  ctx: QueryCtx | MutationCtx,
  sessionId: Id<'cliSessions'>,
  secret: string,
): Promise<Doc<'cliSessions'> | null> {
  const session = await ctx.db.get(sessionId);
  if (!session || session.secret !== secret) return null;
  return session;
}

export const heartbeat = mutation({
  args: { sessionId: v.id('cliSessions'), secret: v.string() },
  handler: async (ctx, { sessionId, secret }): Promise<{ active: boolean }> => {
    const session = await loadVerifiedSession(ctx, sessionId, secret);
    if (!session || session.status !== 'active') return { active: false };

    // A revoked token must stop an in-flight session even mid-stream.
    const token = await ctx.db.get(session.tokenId);
    if (!token || token.revokedAt) {
      await ctx.db.patch(sessionId, { status: 'ended', endedAt: Date.now() });
      return { active: false };
    }

    await ctx.db.patch(sessionId, { lastSeenAt: Date.now() });
    return { active: true };
  },
});

export const endSession = mutation({
  args: { sessionId: v.id('cliSessions'), secret: v.string() },
  handler: async (ctx, { sessionId, secret }): Promise<void> => {
    const session = await loadVerifiedSession(ctx, sessionId, secret);
    if (session && session.status === 'active') {
      await ctx.db.patch(sessionId, { status: 'ended', endedAt: Date.now() });
    }
  },
});

// Routing hook for delivery.attempt: the most recent active session for a source whose heartbeat
// is still fresh, or null. When null, production delivery proceeds unchanged.
export const findActiveSession = internalQuery({
  args: { sourceId: v.id('sources') },
  handler: async (ctx, { sourceId }): Promise<{ sessionId: Id<'cliSessions'> } | null> => {
    const cutoff = Date.now() - SESSION_STALE_MS;
    const sessions = await ctx.db
      .query('cliSessions')
      .withIndex('by_source_status', (q) => q.eq('sourceId', sourceId).eq('status', 'active'))
      .collect();
    let best: Doc<'cliSessions'> | null = null;
    for (const s of sessions) {
      if (s.lastSeenAt < cutoff) continue;
      if (!best || s.lastSeenAt > best.lastSeenAt) best = s;
    }
    return best ? { sessionId: best._id } : null;
  },
});
