import { describe, expect, it } from 'vitest';
import { extractVerifiedPhone, hashPhone } from './phone';

const KEY = 'dGVzdC1wZXBwZXItbm90LWEtcmVhbC1rZXktMzJieXRl';

describe('hashPhone', () => {
  it('is deterministic for the same number and key', async () => {
    expect(await hashPhone('+15551234567', KEY)).toBe(await hashPhone('+15551234567', KEY));
  });

  it('is a hex digest, not the raw number, and differs from a plain SHA-256 (pepper applied)', async () => {
    const h = await hashPhone('+15551234567', KEY);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain('5551234567');

    // Plain SHA-256 of the same number; HMAC-with-pepper must not equal it.
    const sha = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('+15551234567'));
    const shaHex = Array.from(new Uint8Array(sha))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    expect(h).not.toBe(shaHex);
  });

  it('changes when the pepper changes', async () => {
    const a = await hashPhone('+15551234567', KEY);
    const b = await hashPhone('+15551234567', 'a-different-pepper');
    expect(a).not.toBe(b);
  });

  it('differs for different numbers', async () => {
    expect(await hashPhone('+15551234567', KEY)).not.toBe(await hashPhone('+15559999999', KEY));
  });
});

describe('extractVerifiedPhone', () => {
  it('returns the first verified phone in E.164', () => {
    const phones = [
      { phone_number: '+15550000000', verification: { status: 'unverified' } },
      { phone_number: '+15551234567', verification: { status: 'verified' } },
    ];
    expect(extractVerifiedPhone(phones)).toBe('+15551234567');
  });

  it('returns null when none are verified or the list is missing', () => {
    expect(extractVerifiedPhone([{ phone_number: '+1555', verification: { status: 'unverified' } }])).toBeNull();
    expect(extractVerifiedPhone(undefined)).toBeNull();
    expect(extractVerifiedPhone([])).toBeNull();
  });
});
