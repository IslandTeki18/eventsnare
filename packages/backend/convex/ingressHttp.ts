// Public ingress HTTP action: POST /in/{workspaceSlug}/{sourceId} (SPEC §9, FR-IN-*).
//
// Reads the raw body byte-for-byte, resolves the source, decrypts its signing secret,
// verifies the provider signature, extracts the event id/type, and persists via the ingress
// mutation BEFORE returning 2xx (durability invariant). Signature-invalid events are still
// persisted (signatureValid=false) for dashboard debugging and simply not forwarded.
// Payloads over 100KB go to Convex File Storage; smaller ones are stored inline.

import { httpAction } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { getAdapter } from './providers';
import { decryptSecret } from './lib/crypto';

const MAX_INLINE_BYTES = 100 * 1024; // SPEC: <=100KB inline, larger to File Storage

// The provider signature header we forward as X-Eventsnare-Original-Signature.
const SIGNATURE_HEADERS = [
  'stripe-signature',
  'x-hub-signature-256',
  'x-shopify-hmac-sha256',
  'svix-signature',
];

function originalSignature(headers: Headers): string | undefined {
  for (const name of SIGNATURE_HEADERS) {
    const value = headers.get(name);
    if (value) return value;
  }
  return undefined;
}

export const ingress = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean); // ['in', slug, sourceId]
  const [prefix, slug, sourceId] = parts;
  if (parts.length !== 3 || prefix !== 'in' || !slug || !sourceId) {
    return new Response('Not found', { status: 404 });
  }

  const resolved = await ctx.runQuery(internal.sources.resolveIngress, { slug, sourceId });
  if (!resolved) return new Response('Unknown source', { status: 404 });

  const adapter = getAdapter(resolved.provider);
  if (!adapter) return new Response('Unsupported provider', { status: 400 });

  const bodyBytes = new Uint8Array(await request.arrayBuffer());
  const rawBody = new TextDecoder().decode(bodyBytes);

  const secret = await decryptSecret(resolved.signingSecretEncrypted);
  const verification = await adapter.verifySignature(
    { rawBody, headers: request.headers },
    secret,
  );

  let providerEventId: string;
  let eventType: string;
  try {
    providerEventId = adapter.extractEventId(rawBody, request.headers) || `noid_${Date.now()}`;
    eventType = adapter.extractEventType(rawBody, request.headers) || 'unknown';
  } catch {
    providerEventId = `noid_${Date.now()}`;
    eventType = 'unknown';
  }

  const headersObj: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  // Large-payload branch: store oversized bodies in File Storage, keep small ones inline.
  let rawBodyInline: string | undefined;
  let rawBodyStorageId: Id<'_storage'> | undefined;
  if (bodyBytes.length > MAX_INLINE_BYTES) {
    rawBodyStorageId = await ctx.storage.store(new Blob([bodyBytes]));
  } else {
    rawBodyInline = rawBody;
  }

  await ctx.runMutation(internal.ingress.ingestFromHttp, {
    sourceId: sourceId as Id<'sources'>,
    providerEventId,
    eventType,
    signatureValid: verification.valid,
    rawBodyInline,
    rawBodyStorageId,
    headersJson: JSON.stringify(headersObj),
    sourceIp: request.headers.get('x-forwarded-for') ?? undefined,
    originalSignature: originalSignature(request.headers),
    skipDelivery: resolved.paused,
  });

  // 2xx only after durable persistence (FR-IN-4).
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

export const healthz = httpAction(async () => {
  return new Response('ok', { status: 200 });
});

export const status = httpAction(async () => {
  return new Response(JSON.stringify({ status: 'operational' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
