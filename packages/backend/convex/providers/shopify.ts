// Shopify signature scheme: `X-Shopify-Hmac-Sha256: <base64Hmac>`, HMAC-SHA256 over the raw
// body with the app's webhook secret, base64-encoded. Event id is `X-Shopify-Webhook-Id`;
// event type is the `X-Shopify-Topic` header (e.g. `orders/create`).

import type { IncomingRequest, ProviderAdapter, VerificationResult } from './types';
import { hmacSha256, toBase64, timingSafeEqual } from './hmac';

export const shopifyAdapter: ProviderAdapter = {
  name: 'shopify',

  async verifySignature(req: IncomingRequest, secret: string): Promise<VerificationResult> {
    const header = req.headers.get('x-shopify-hmac-sha256');
    if (!header) return { valid: false, reason: 'Missing X-Shopify-Hmac-Sha256 header' };
    const expected = toBase64(await hmacSha256(secret, req.rawBody));
    return timingSafeEqual(header, expected)
      ? { valid: true }
      : { valid: false, reason: 'Signature mismatch' };
  },

  extractEventId(_body: string, headers: Headers): string {
    return headers.get('x-shopify-webhook-id') ?? '';
  },

  extractEventType(_body: string, headers: Headers): string {
    return headers.get('x-shopify-topic') ?? '';
  },
};
