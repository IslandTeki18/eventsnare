// GitHub signature scheme: `X-Hub-Signature-256: sha256=<hexHmac>`, HMAC-SHA256 over the
// raw body with the webhook secret. Event id is the `X-GitHub-Delivery` UUID; event type is
// the `X-GitHub-Event` header (e.g. `push`, `pull_request`).

import type { IncomingRequest, ProviderAdapter, VerificationResult } from './types';
import { hmacSha256, toHex, timingSafeEqual } from './hmac';

export const githubAdapter: ProviderAdapter = {
  name: 'github',

  async verifySignature(req: IncomingRequest, secret: string): Promise<VerificationResult> {
    const header = req.headers.get('x-hub-signature-256');
    if (!header) return { valid: false, reason: 'Missing X-Hub-Signature-256 header' };
    const expected = `sha256=${toHex(await hmacSha256(secret, req.rawBody))}`;
    return timingSafeEqual(header, expected)
      ? { valid: true }
      : { valid: false, reason: 'Signature mismatch' };
  },

  extractEventId(_body: string, headers: Headers): string {
    return headers.get('x-github-delivery') ?? '';
  },

  extractEventType(_body: string, headers: Headers): string {
    return headers.get('x-github-event') ?? '';
  },
};
