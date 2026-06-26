import { describe, it, expect } from 'vitest';
import { Webhook } from 'svix';
import { clerkAdapter, resendAdapter } from './index';

// A valid Svix-format base64 secret (the canonical Svix doc example).
const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';

function signedHeaders(msgId: string, payload: string): Headers {
  const wh = new Webhook(SECRET);
  const timestamp = new Date();
  const signature = wh.sign(msgId, timestamp, payload);
  return new Headers({
    'svix-id': msgId,
    'svix-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
    'svix-signature': signature,
  });
}

for (const [label, adapter] of [
  ['clerkAdapter', clerkAdapter],
  ['resendAdapter', resendAdapter],
] as const) {
  describe(label, () => {
    const payload = JSON.stringify({ type: 'user.created', data: { id: 'user_1' } });

    it('accepts a correctly signed payload', async () => {
      const headers = signedHeaders('msg_2abc', payload);
      const result = await adapter.verifySignature({ rawBody: payload, headers }, SECRET);
      expect(result.valid).toBe(true);
    });

    it('rejects a tampered body', async () => {
      const headers = signedHeaders('msg_2abc', payload);
      const result = await adapter.verifySignature(
        { rawBody: payload + ' ', headers },
        SECRET,
      );
      expect(result.valid).toBe(false);
    });

    it('rejects missing svix headers', async () => {
      const result = await adapter.verifySignature(
        { rawBody: payload, headers: new Headers() },
        SECRET,
      );
      expect(result.valid).toBe(false);
    });

    it('extracts event id from svix-id and type from body', () => {
      const headers = signedHeaders('msg_2abc', payload);
      expect(adapter.extractEventId(payload, headers)).toBe('msg_2abc');
      expect(adapter.extractEventType(payload, headers)).toBe('user.created');
    });
  });
}
