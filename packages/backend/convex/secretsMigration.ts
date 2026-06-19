// Key-rotation migration (SPEC §12). After setting SECRETS_ENCRYPTION_KEY to the new key and
// SECRETS_ENCRYPTION_KEY_PREVIOUS to the old one, run:
//
//   npx convex run secretsMigration:reencryptAllSecrets
//
// It decrypts every source's encrypted blobs (signing secret, custom forward headers, outbound
// signing secret) using the primary-then-previous fallback in lib/crypto and re-encrypts each
// with the primary key. Once it reports done with zero failures, remove
// SECRETS_ENCRYPTION_KEY_PREVIOUS. The job is idempotent: re-running re-encrypts blobs that are
// already on the new key (a no-op in effect), so a partial run can be retried safely.
//
// Scale note: collects all sources in one query. Fine for v1 (hundreds of sources). If the
// table grows large, page this with a cursor.

import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { decryptSecret, encryptSecret } from './lib/crypto';

export const listAllSourceSecrets = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sources = await ctx.db.query('sources').collect();
    return sources.map((s) => ({
      id: s._id,
      signingSecretEncrypted: s.signingSecretEncrypted,
      forwardHeaders: s.forwardHeaders,
      outboundSigningSecretEncrypted: s.outboundSigningSecretEncrypted,
    }));
  },
});

// Raw, unscoped patch of a source's encrypted fields. Internal-only and used solely by the
// migration, which runs without a user identity, so it deliberately skips workspace ownership.
export const patchSourceSecrets = internalMutation({
  args: {
    sourceId: v.id('sources'),
    signingSecretEncrypted: v.optional(v.string()),
    forwardHeaders: v.optional(v.string()),
    outboundSigningSecretEncrypted: v.optional(v.string()),
  },
  handler: async (ctx, { sourceId, ...fields }) => {
    await ctx.db.patch(sourceId, fields);
  },
});

export const reencryptAllSecrets = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ total: number; reencrypted: number; failures: Id<'sources'>[] }> => {
    const sources = await ctx.runQuery(internal.secretsMigration.listAllSourceSecrets, {});
    const failures: Id<'sources'>[] = [];
    let reencrypted = 0;

    const rotate = async (blob: string): Promise<string> =>
      encryptSecret(await decryptSecret(blob));

    for (const source of sources) {
      try {
        const patch: {
          sourceId: Id<'sources'>;
          signingSecretEncrypted?: string;
          forwardHeaders?: string;
          outboundSigningSecretEncrypted?: string;
        } = { sourceId: source.id };

        patch.signingSecretEncrypted = await rotate(source.signingSecretEncrypted);
        if (source.forwardHeaders) {
          patch.forwardHeaders = await rotate(source.forwardHeaders);
        }
        if (source.outboundSigningSecretEncrypted) {
          patch.outboundSigningSecretEncrypted = await rotate(
            source.outboundSigningSecretEncrypted,
          );
        }

        await ctx.runMutation(internal.secretsMigration.patchSourceSecrets, patch);
        reencrypted++;
      } catch {
        failures.push(source.id);
      }
    }

    return { total: sources.length, reencrypted, failures };
  },
});
