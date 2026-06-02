import { describe, it, expect } from 'vitest';
import { stripeAdapter } from './stripe';
import { hmacSha256, toHex } from './hmac';

const SECRET = 'whsec_test_stripe_secret';
const PAYLOAD = JSON.stringify({ id: 'evt_123', type: 'customer.subscription.deleted' });

async function signedHeaders(payload: string, secret: string): Promise<Headers> {
  const t = Math.floor(Date.now() / 1000);
  const sig = toHex(await hmacSha256(secret, `${t}.${payload}`));
  return new Headers({ 'stripe-signature': `t=${t},v1=${sig}` });
}

describe('stripeAdapter', () => {
  it('accepts a correctly signed payload', async () => {
    const headers = await signedHeaders(PAYLOAD, SECRET);
    const result = await stripeAdapter.verifySignature({ rawBody: PAYLOAD, headers }, SECRET);
    expect(result.valid).toBe(true);
  });

  it('rejects a tampered body', async () => {
    const headers = await signedHeaders(PAYLOAD, SECRET);
    const result = await stripeAdapter.verifySignature(
      { rawBody: PAYLOAD + ' ', headers },
      SECRET,
    );
    expect(result.valid).toBe(false);
  });

  it('rejects a wrong secret', async () => {
    const headers = await signedHeaders(PAYLOAD, SECRET);
    const result = await stripeAdapter.verifySignature(
      { rawBody: PAYLOAD, headers },
      'whsec_wrong',
    );
    expect(result.valid).toBe(false);
  });

  it('rejects a missing header', async () => {
    const result = await stripeAdapter.verifySignature(
      { rawBody: PAYLOAD, headers: new Headers() },
      SECRET,
    );
    expect(result.valid).toBe(false);
  });

  it('extracts event id and type from the body', () => {
    expect(stripeAdapter.extractEventId(PAYLOAD, new Headers())).toBe('evt_123');
    expect(stripeAdapter.extractEventType(PAYLOAD, new Headers())).toBe(
      'customer.subscription.deleted',
    );
  });
});
