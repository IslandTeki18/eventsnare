import { describe, it, expect } from 'vitest';
import { shopifyAdapter } from './shopify';
import { hmacSha256, toBase64 } from './hmac';

const SECRET = 'shpss_shopify_secret';
const PAYLOAD = JSON.stringify({ id: 820982911946154508, financial_status: 'paid' });

async function header(payload: string, secret: string): Promise<string> {
  return toBase64(await hmacSha256(secret, payload));
}

describe('shopifyAdapter', () => {
  it('accepts a correctly signed payload', async () => {
    const headers = new Headers({ 'x-shopify-hmac-sha256': await header(PAYLOAD, SECRET) });
    const result = await shopifyAdapter.verifySignature({ rawBody: PAYLOAD, headers }, SECRET);
    expect(result.valid).toBe(true);
  });

  it('rejects a tampered body', async () => {
    const headers = new Headers({ 'x-shopify-hmac-sha256': await header(PAYLOAD, SECRET) });
    const result = await shopifyAdapter.verifySignature(
      { rawBody: PAYLOAD + 'x', headers },
      SECRET,
    );
    expect(result.valid).toBe(false);
  });

  it('rejects a wrong secret', async () => {
    const headers = new Headers({ 'x-shopify-hmac-sha256': await header(PAYLOAD, SECRET) });
    const result = await shopifyAdapter.verifySignature({ rawBody: PAYLOAD, headers }, 'nope');
    expect(result.valid).toBe(false);
  });

  it('rejects a missing header', async () => {
    const result = await shopifyAdapter.verifySignature(
      { rawBody: PAYLOAD, headers: new Headers() },
      SECRET,
    );
    expect(result.valid).toBe(false);
  });

  it('extracts event id and type from headers', () => {
    const headers = new Headers({
      'x-shopify-webhook-id': 'b54557e4-bdd9-4b37-8c4a-3a2b3a1f1f1f',
      'x-shopify-topic': 'orders/create',
    });
    expect(shopifyAdapter.extractEventId(PAYLOAD, headers)).toBe(
      'b54557e4-bdd9-4b37-8c4a-3a2b3a1f1f1f',
    );
    expect(shopifyAdapter.extractEventType(PAYLOAD, headers)).toBe('orders/create');
  });
});
