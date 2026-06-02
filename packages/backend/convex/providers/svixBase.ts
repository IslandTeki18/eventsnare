// Clerk and Resend both sign webhooks with Svix, so they share one verification path.
// Svix headers: `svix-id`, `svix-timestamp`, `svix-signature`. The signed content is
// `${id}.${timestamp}.${rawBody}`, HMAC-SHA256 with the base64 secret (the part after the
// `whsec_` prefix). We delegate to the `svix` package (already used by the Clerk webhook
// handler) so behavior matches the providers exactly.
//
// Event id is the `svix-id` header; event type is the payload's `type` field.

import { Webhook } from 'svix';
import type { IncomingRequest, ProviderAdapter, VerificationResult } from './types';

export function createSvixAdapter(name: string): ProviderAdapter {
  return {
    name,

    async verifySignature(
      req: IncomingRequest,
      secret: string,
    ): Promise<VerificationResult> {
      const headers = {
        'svix-id': req.headers.get('svix-id') ?? '',
        'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
        'svix-signature': req.headers.get('svix-signature') ?? '',
      };
      if (!headers['svix-id'] || !headers['svix-timestamp'] || !headers['svix-signature']) {
        return { valid: false, reason: 'Missing svix-* headers' };
      }
      try {
        new Webhook(secret).verify(req.rawBody, headers);
        return { valid: true };
      } catch (err) {
        return {
          valid: false,
          reason: err instanceof Error ? err.message : 'Svix verification failed',
        };
      }
    },

    extractEventId(_body: string, headers: Headers): string {
      return headers.get('svix-id') ?? '';
    },

    extractEventType(body: string): string {
      return JSON.parse(body).type;
    },

    parseTimestamp(headers: Headers): Date | null {
      const ts = headers.get('svix-timestamp');
      return ts ? new Date(Number(ts) * 1000) : null;
    },
  };
}
