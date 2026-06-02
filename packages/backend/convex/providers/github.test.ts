import { describe, it, expect } from 'vitest';
import { githubAdapter } from './github';
import { hmacSha256, toHex } from './hmac';

const SECRET = 'gh_webhook_secret';
const PAYLOAD = JSON.stringify({ zen: 'Keep it simple.' });

async function header(payload: string, secret: string): Promise<string> {
  return `sha256=${toHex(await hmacSha256(secret, payload))}`;
}

describe('githubAdapter', () => {
  it('accepts a correctly signed payload', async () => {
    const headers = new Headers({ 'x-hub-signature-256': await header(PAYLOAD, SECRET) });
    const result = await githubAdapter.verifySignature({ rawBody: PAYLOAD, headers }, SECRET);
    expect(result.valid).toBe(true);
  });

  it('rejects a tampered body', async () => {
    const headers = new Headers({ 'x-hub-signature-256': await header(PAYLOAD, SECRET) });
    const result = await githubAdapter.verifySignature(
      { rawBody: '{"zen":"tampered"}', headers },
      SECRET,
    );
    expect(result.valid).toBe(false);
  });

  it('rejects a wrong secret', async () => {
    const headers = new Headers({ 'x-hub-signature-256': await header(PAYLOAD, SECRET) });
    const result = await githubAdapter.verifySignature({ rawBody: PAYLOAD, headers }, 'nope');
    expect(result.valid).toBe(false);
  });

  it('rejects a missing header', async () => {
    const result = await githubAdapter.verifySignature(
      { rawBody: PAYLOAD, headers: new Headers() },
      SECRET,
    );
    expect(result.valid).toBe(false);
  });

  it('extracts event id and type from headers', () => {
    const headers = new Headers({
      'x-github-delivery': '72d3162e-cc78-11e3-81ab-4c9367dc0958',
      'x-github-event': 'push',
    });
    expect(githubAdapter.extractEventId(PAYLOAD, headers)).toBe(
      '72d3162e-cc78-11e3-81ab-4c9367dc0958',
    );
    expect(githubAdapter.extractEventType(PAYLOAD, headers)).toBe('push');
  });
});
