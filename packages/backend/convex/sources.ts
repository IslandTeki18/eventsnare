// Source management (SPEC FR-SRC-*). A source is a configured webhook ingress: a provider,
// an encrypted signing secret, and a forward URL. Secret encryption uses a random IV
// (crypto.getRandomValues), which is forbidden in mutations, so create/update/rotate are
// actions that encrypt and then delegate persistence to an internal mutation. Plain reads
// and status toggles stay as queries/mutations. Secrets are never returned to the client.

import { v } from 'convex/values';
import { action, mutation, query, internalMutation, internalQuery } from './_generated/server';
import type { MutationCtx, QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { internal, api } from './_generated/api';
import { encryptSecret, decryptSecret, generateOutboundSecret } from './lib/crypto';
import { validateForwardHeaders } from './lib/forwardHeaders';
import { consumeRateLimit } from './lib/rateLimit';
import { requireUser } from './lib/auth';
import { isSupportedProvider } from './providers';
import { requireWorkspace } from './workspaces';

// Outbound signing secret reveals are sensitive; cap them so a compromised session cannot dump
// the plaintext in a loop, and audit every reveal.
const REVEAL_LIMIT = 10;
const REVEAL_WINDOW_MS = 600_000; // 10 minutes

function ingressPathFor(slug: string, sourceId: string): string {
  return `/in/${slug}/${sourceId}`;
}

function toDto(source: Doc<'sources'>, slug: string) {
  const base = process.env.HOOKS_BASE_URL ?? '';
  const path = ingressPathFor(slug, source._id);
  return {
    _id: source._id,
    provider: source.provider,
    name: source.name,
    forwardUrl: source.forwardUrl,
    status: source.status,
    maxRetries: source.maxRetries,
    createdAt: source.createdAt,
    ingressPath: path,
    ingressUrl: base ? `${base}${path}` : '',
    // Outbound security (P2). Header values stay encrypted server-side; only the names are
    // exposed. The outbound signing secret is revealed on demand via revealOutboundSecret.
    forwardHeaderKeys: source.forwardHeaderKeys ?? [],
    hasOutboundSecret: source.outboundSigningSecretEncrypted !== undefined,
  };
}

function validateForwardUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Forward URL is not a valid URL');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Forward URL must be http(s)');
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const workspace = await requireWorkspace(ctx);
    const sources = await ctx.db
      .query('sources')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    return sources.filter((s) => !s.deletedAt).map((s) => toDto(s, workspace.slug));
  },
});

export const get = query({
  args: { sourceId: v.id('sources') },
  handler: async (ctx, { sourceId }) => {
    const workspace = await requireWorkspace(ctx);
    const source = await ctx.db.get(sourceId);
    if (!source || source.workspaceId !== workspace._id || source.deletedAt) return null;
    return toDto(source, workspace.slug);
  },
});

export const create = action({
  args: {
    provider: v.string(),
    name: v.string(),
    forwardUrl: v.string(),
    signingSecret: v.string(),
    maxRetries: v.optional(v.number()),
    forwardHeaders: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ sourceId: Id<'sources'>; slug: string; ingressPath: string }> => {
    if (!isSupportedProvider(args.provider)) {
      throw new Error(`Unsupported provider: ${args.provider}`);
    }
    validateForwardUrl(args.forwardUrl);
    const maxRetries = clampRetries(args.maxRetries ?? 7);
    const signingSecretEncrypted = await encryptSecret(args.signingSecret);
    const headers = await encodeForwardHeaders(args.forwardHeaders);
    // Every new source is signed by default so customers can verify origin from day one.
    const outboundSigningSecretEncrypted = await encryptSecret(generateOutboundSecret());
    return await ctx.runMutation(internal.sources.insertSource, {
      provider: args.provider,
      name: args.name,
      forwardUrl: args.forwardUrl,
      signingSecretEncrypted,
      maxRetries,
      forwardHeaders: headers?.encrypted,
      forwardHeaderKeys: headers?.keys,
      outboundSigningSecretEncrypted,
    });
  },
});

// Validate, encrypt, and extract the key names of a custom-header map. Returns undefined when
// no map is provided (leaves the field untouched); an empty map clears headers. Keys are
// trimmed before validation so the stored, validated, and displayed names are identical (and
// never carry whitespace that fetch would reject at delivery).
async function encodeForwardHeaders(
  headers: Record<string, string> | undefined,
): Promise<{ encrypted: string; keys: string[] } | undefined> {
  if (headers === undefined) return undefined;
  const normalized: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    const key = name.trim();
    if (key) normalized[key] = value;
  }
  validateForwardHeaders(normalized);
  return {
    encrypted: await encryptSecret(JSON.stringify(normalized)),
    keys: Object.keys(normalized),
  };
}

export const update = action({
  args: {
    sourceId: v.id('sources'),
    name: v.optional(v.string()),
    forwardUrl: v.optional(v.string()),
    maxRetries: v.optional(v.number()),
    signingSecret: v.optional(v.string()),
    forwardHeaders: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args): Promise<void> => {
    if (args.forwardUrl) validateForwardUrl(args.forwardUrl);
    const signingSecretEncrypted = args.signingSecret
      ? await encryptSecret(args.signingSecret)
      : undefined;
    const headers = await encodeForwardHeaders(args.forwardHeaders);
    await ctx.runMutation(internal.sources.patchSource, {
      sourceId: args.sourceId,
      name: args.name,
      forwardUrl: args.forwardUrl,
      maxRetries: args.maxRetries === undefined ? undefined : clampRetries(args.maxRetries),
      signingSecretEncrypted,
      forwardHeaders: headers?.encrypted,
      forwardHeaderKeys: headers?.keys,
    });
  },
});

export const rotateSecret = action({
  args: { sourceId: v.id('sources'), signingSecret: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const signingSecretEncrypted = await encryptSecret(args.signingSecret);
    await ctx.runMutation(internal.sources.patchSource, {
      sourceId: args.sourceId,
      signingSecretEncrypted,
    });
  },
});

// Generate (or replace) the outbound signing secret used to sign forwarded requests. Older
// sources created before P2 have none until this runs.
export const rotateOutboundSecret = action({
  args: { sourceId: v.id('sources') },
  handler: async (ctx, { sourceId }): Promise<void> => {
    const outboundSigningSecretEncrypted = await encryptSecret(generateOutboundSecret());
    await ctx.runMutation(internal.sources.patchSource, {
      sourceId,
      outboundSigningSecretEncrypted,
    });
  },
});

// Reveal the plaintext outbound signing secret so the customer can verify our signature. The
// internal mutation enforces workspace ownership, rate-limits, and audit-logs the reveal before
// returning the encrypted blob, which is decrypted here in the action.
export const revealOutboundSecret = action({
  args: { sourceId: v.id('sources') },
  handler: async (ctx, { sourceId }): Promise<{ secret: string | null }> => {
    const { blob } = await ctx.runMutation(internal.sources.claimOutboundSecretReveal, {
      sourceId,
    });
    if (!blob) return { secret: null };
    return { secret: await decryptSecret(blob) };
  },
});

function clampRetries(n: number): number {
  return Math.max(1, Math.min(7, Math.round(n)));
}

// Internal persistence. Runs with the calling action's auth identity, so workspace scoping
// is resolved here the same way as everywhere else.
export const insertSource = internalMutation({
  args: {
    provider: v.string(),
    name: v.string(),
    forwardUrl: v.string(),
    signingSecretEncrypted: v.string(),
    maxRetries: v.number(),
    forwardHeaders: v.optional(v.string()),
    forwardHeaderKeys: v.optional(v.array(v.string())),
    outboundSigningSecretEncrypted: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workspace = await requireWorkspace(ctx);
    const sourceId = await ctx.db.insert('sources', {
      workspaceId: workspace._id,
      provider: args.provider,
      name: args.name,
      forwardUrl: args.forwardUrl,
      signingSecretEncrypted: args.signingSecretEncrypted,
      status: 'active',
      maxRetries: args.maxRetries,
      createdAt: Date.now(),
      forwardHeaders: args.forwardHeaders,
      forwardHeaderKeys: args.forwardHeaderKeys,
      outboundSigningSecretEncrypted: args.outboundSigningSecretEncrypted,
    });
    return {
      sourceId,
      slug: workspace.slug,
      ingressPath: ingressPathFor(workspace.slug, sourceId),
    };
  },
});

export const patchSource = internalMutation({
  args: {
    sourceId: v.id('sources'),
    name: v.optional(v.string()),
    forwardUrl: v.optional(v.string()),
    maxRetries: v.optional(v.number()),
    signingSecretEncrypted: v.optional(v.string()),
    forwardHeaders: v.optional(v.string()),
    forwardHeaderKeys: v.optional(v.array(v.string())),
    outboundSigningSecretEncrypted: v.optional(v.string()),
  },
  handler: async (ctx, { sourceId, ...patch }) => {
    const source = await requireOwnedSource(ctx, sourceId);
    const fields: Partial<Doc<'sources'>> = {};
    if (patch.name !== undefined) fields.name = patch.name;
    if (patch.forwardUrl !== undefined) fields.forwardUrl = patch.forwardUrl;
    if (patch.maxRetries !== undefined) fields.maxRetries = patch.maxRetries;
    if (patch.signingSecretEncrypted !== undefined) {
      fields.signingSecretEncrypted = patch.signingSecretEncrypted;
    }
    if (patch.forwardHeaders !== undefined) {
      fields.forwardHeaders = patch.forwardHeaders;
      fields.forwardHeaderKeys = patch.forwardHeaderKeys ?? [];
    }
    if (patch.outboundSigningSecretEncrypted !== undefined) {
      fields.outboundSigningSecretEncrypted = patch.outboundSigningSecretEncrypted;
    }
    await ctx.db.patch(source._id, fields);
  },
});

// Ownership-checked, rate-limited, audited claim for a source's encrypted outbound secret, for
// revealOutboundSecret. Throws when the per-source reveal limit is exceeded.
export const claimOutboundSecretReveal = internalMutation({
  args: { sourceId: v.id('sources') },
  handler: async (ctx, { sourceId }): Promise<{ blob: string | null }> => {
    const source = await requireOwnedSource(ctx, sourceId);
    const user = await requireUser(ctx);

    const allowed = await consumeRateLimit(
      ctx,
      `reveal:outbound:${sourceId}`,
      REVEAL_LIMIT,
      REVEAL_WINDOW_MS,
      Date.now(),
    );
    if (!allowed) {
      throw new Error('Too many reveals for this source. Try again in a few minutes.');
    }

    await ctx.db.insert('activityLogs', {
      actorUserId: user._id,
      action: 'source.outbound_secret.reveal',
      targetType: 'source',
      targetId: sourceId,
      createdAt: Date.now(),
    });

    return { blob: source.outboundSigningSecretEncrypted ?? null };
  },
});

export const pause = mutation({
  args: { sourceId: v.id('sources') },
  handler: async (ctx, { sourceId }) => {
    const source = await requireOwnedSource(ctx, sourceId);
    await ctx.db.patch(source._id, { status: 'paused' });
  },
});

export const resume = mutation({
  args: { sourceId: v.id('sources') },
  handler: async (ctx, { sourceId }) => {
    const source = await requireOwnedSource(ctx, sourceId);
    await ctx.db.patch(source._id, { status: 'active' });
  },
});

// Soft delete: status flips and deletedAt is stamped. A cron hard-deletes after 30 days
// (FR-SRC-6); that sweep is a separate slice.
export const softDelete = mutation({
  args: { sourceId: v.id('sources') },
  handler: async (ctx, { sourceId }) => {
    const source = await requireOwnedSource(ctx, sourceId);
    await ctx.db.patch(source._id, { status: 'deleted', deletedAt: Date.now() });
  },
});

async function requireOwnedSource(
  ctx: MutationCtx | QueryCtx,
  sourceId: Id<'sources'>,
): Promise<Doc<'sources'>> {
  const workspace = await requireWorkspace(ctx);
  const source = await ctx.db.get(sourceId);
  if (!source || source.workspaceId !== workspace._id) {
    throw new Error('Source not found');
  }
  return source;
}

// Ingress-path resolution for the public HTTP route. NOT workspace-scoped to an authed user
// (the caller is the provider, unauthenticated); instead it confirms the slug matches the
// source's workspace. Returns the decryption material and whether the source is paused.
// Deleted sources resolve to null (404).
export const resolveIngress = internalQuery({
  args: { slug: v.string(), sourceId: v.string() },
  handler: async (ctx, { slug, sourceId }) => {
    let source: Doc<'sources'> | null;
    try {
      source = await ctx.db.get(sourceId as Id<'sources'>);
    } catch {
      return null; // malformed id
    }
    if (!source || source.status === 'deleted' || source.deletedAt) return null;
    const workspace = await ctx.db.get(source.workspaceId);
    if (!workspace || workspace.slug !== slug) return null;
    return {
      provider: source.provider,
      signingSecretEncrypted: source.signingSecretEncrypted,
      paused: source.status === 'paused',
    };
  },
});

// SPEC §10 step 6: ping the customer's forward URL with a synthetic event to verify
// connectivity. Reuses the real persistence + delivery path so the test event also appears
// in the dashboard event list.
export const sendTestEvent = action({
  args: { sourceId: v.id('sources') },
  handler: async (ctx, { sourceId }): Promise<{ eventId: Id<'events'> }> => {
    const source = await ctx.runQuery(api.sources.get, { sourceId });
    if (!source) throw new Error('Source not found');
    const providerEventId = `eventsnare_test_${Date.now()}`;
    const body = JSON.stringify({
      id: providerEventId,
      type: 'eventsnare.test',
      provider: source.provider,
      message: 'Test event from Eventsnare',
    });
    const { eventId } = await ctx.runMutation(internal.ingress.ingestFromHttp, {
      sourceId,
      providerEventId,
      eventType: 'eventsnare.test',
      signatureValid: true,
      rawBodyInline: body,
      isTest: true,
    });
    return { eventId };
  },
});
