import { describe, expect, it } from 'vitest';
import { generateCliToken, generateSessionSecret, hashCliToken } from './cliAuth';

describe('generateCliToken', () => {
  it('produces a prefixed 64-hex-char token and a matching display prefix', () => {
    const { token, prefix } = generateCliToken();
    expect(token).toMatch(/^escli_[0-9a-f]{64}$/);
    expect(prefix).toMatch(/^escli_[0-9a-f]{8}$/);
    // The display prefix is the literal marker plus the first 8 hex chars of the body.
    expect(token.startsWith(prefix)).toBe(true);
  });

  it('is unique across calls', () => {
    const a = generateCliToken().token;
    const b = generateCliToken().token;
    expect(a).not.toBe(b);
  });
});

describe('hashCliToken', () => {
  it('is deterministic for the same token', async () => {
    const { token } = generateCliToken();
    expect(await hashCliToken(token)).toBe(await hashCliToken(token));
  });

  it('differs for different tokens and is not the raw token', async () => {
    const a = generateCliToken().token;
    const b = generateCliToken().token;
    const ha = await hashCliToken(a);
    expect(ha).toMatch(/^[0-9a-f]{64}$/);
    expect(ha).not.toBe(a);
    expect(ha).not.toBe(await hashCliToken(b));
  });
});

describe('generateSessionSecret', () => {
  it('produces a 48-hex-char secret unique per call', () => {
    const a = generateSessionSecret();
    const b = generateSessionSecret();
    expect(a).toMatch(/^[0-9a-f]{48}$/);
    expect(a).not.toBe(b);
  });
});
