// Stripe signature scheme: the `Stripe-Signature` header carries `t=<unix>,v1=<hexHmac>`
// (and may repeat v1 across multiple secrets). The signed payload is `${t}.${rawBody}` and
// the signature is HMAC-SHA256 over it, hex-encoded.
//
// Implemented directly (not via the Stripe SDK) so verification matches the GitHub/Shopify
// adapters, stays pure/testable, and carries no SDK coupling. We intentionally do NOT
// enforce Stripe's timestamp tolerance: Eventsnare is a durable relay and must accept and
// persist legitimately late/replayed deliveries rather than reject them (FR-IN-4).

import type { IncomingRequest, ProviderAdapter, VerificationResult } from './types';
import { hmacSha256, toHex, timingSafeEqual } from './hmac';

function parseHeader(header: string): { t?: string; v1: string[] } {
  const out: { t?: string; v1: string[] } = { v1: [] };
  for (const part of header.split(',')) {
    const [key, value] = part.split('=', 2);
    if (value === undefined) continue;
    if (key === 't') out.t = value;
    else if (key === 'v1') out.v1.push(value);
  }
  return out;
}

export const stripeAdapter: ProviderAdapter = {
  name: 'stripe',

  async verifySignature(req: IncomingRequest, secret: string): Promise<VerificationResult> {
    const header = req.headers.get('stripe-signature');
    if (!header) return { valid: false, reason: 'Missing Stripe-Signature header' };
    const { t, v1 } = parseHeader(header);
    if (!t || v1.length === 0) {
      return { valid: false, reason: 'Malformed Stripe-Signature header' };
    }
    const expected = toHex(await hmacSha256(secret, `${t}.${req.rawBody}`));
    const match = v1.some((sig) => timingSafeEqual(sig, expected));
    return match ? { valid: true } : { valid: false, reason: 'Signature mismatch' };
  },

  extractEventId(body: string): string {
    return JSON.parse(body).id;
  },

  extractEventType(body: string): string {
    return JSON.parse(body).type;
  },

  parseTimestamp(headers: Headers): Date | null {
    const header = headers.get('stripe-signature');
    if (!header) return null;
    const { t } = parseHeader(header);
    return t ? new Date(Number(t) * 1000) : null;
  },
};
