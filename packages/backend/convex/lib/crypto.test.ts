import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret } from './crypto';

function makeKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

describe('crypto secret encryption', () => {
  it('roundtrips a value with the primary key', async () => {
    process.env.SECRETS_ENCRYPTION_KEY = makeKey();
    delete process.env.SECRETS_ENCRYPTION_KEY_PREVIOUS;
    const blob = await encryptSecret('whsec_abc');
    expect(await decryptSecret(blob)).toBe('whsec_abc');
  });

  it('decrypts old-key blobs via the previous-key fallback during rotation', async () => {
    const oldKey = makeKey();
    process.env.SECRETS_ENCRYPTION_KEY = oldKey;
    delete process.env.SECRETS_ENCRYPTION_KEY_PREVIOUS;
    const oldBlob = await encryptSecret('secret-1');

    // Rotate: new key primary, old key in the previous slot.
    const newKey = makeKey();
    process.env.SECRETS_ENCRYPTION_KEY = newKey;
    process.env.SECRETS_ENCRYPTION_KEY_PREVIOUS = oldKey;

    expect(await decryptSecret(oldBlob)).toBe('secret-1');

    // New writes use the new key and decrypt with the primary alone after the previous slot is
    // removed (i.e. after the reencrypt migration completes).
    const newBlob = await encryptSecret('secret-2');
    delete process.env.SECRETS_ENCRYPTION_KEY_PREVIOUS;
    expect(await decryptSecret(newBlob)).toBe('secret-2');
  });

  it('throws when neither the primary nor previous key can decrypt the blob', async () => {
    process.env.SECRETS_ENCRYPTION_KEY = makeKey();
    delete process.env.SECRETS_ENCRYPTION_KEY_PREVIOUS;
    const blob = await encryptSecret('x');

    process.env.SECRETS_ENCRYPTION_KEY = makeKey(); // unrelated key, no previous slot
    delete process.env.SECRETS_ENCRYPTION_KEY_PREVIOUS;
    await expect(decryptSecret(blob)).rejects.toThrow();
  });
});
