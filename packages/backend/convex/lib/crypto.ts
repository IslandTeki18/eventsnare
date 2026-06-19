// Application-layer encryption for source signing secrets (SPEC NFR-SEC-2).
//
// AES-256-GCM with a fresh 12-byte IV per encryption. The stored blob is base64 of
// (iv || ciphertext+tag). The key comes from the SECRETS_ENCRYPTION_KEY env var, a
// base64-encoded 32-byte (256-bit) key set via `npx convex env set`.
//
// Key rotation: set the old key as SECRETS_ENCRYPTION_KEY_PREVIOUS and the new key as
// SECRETS_ENCRYPTION_KEY. Encryption always uses the primary; decryption falls back to the
// previous key so existing blobs keep decrypting during the transition. Run the reencrypt
// migration (secretsMigration.reencryptAllSecrets) to rewrite every blob with the new key,
// then remove SECRETS_ENCRYPTION_KEY_PREVIOUS. See SPEC §12.
//
// IMPORTANT: these functions call crypto.getRandomValues (non-deterministic) and therefore
// MUST run only in action or httpAction contexts, never in a query or mutation.

import { bytesToHex } from './encoding';

const ENV_KEY = 'SECRETS_ENCRYPTION_KEY';
const ENV_KEY_PREVIOUS = 'SECRETS_ENCRYPTION_KEY_PREVIOUS';
const IV_BYTES = 12;

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

async function importKeyFrom(envName: string): Promise<CryptoKey | null> {
  const raw = process.env[envName];
  if (!raw) return null;
  const keyBytes = base64ToBytes(raw);
  if (keyBytes.length !== 32) {
    throw new Error(`${envName} must decode to 32 bytes (got ${keyBytes.length})`);
  }
  // Cast to BufferSource: lib.dom types a Uint8Array as Uint8Array<ArrayBufferLike>, which
  // is not structurally assignable to BufferSource under strict settings even though it is
  // valid at runtime.
  return await crypto.subtle.importKey('raw', keyBytes as BufferSource, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

async function primaryKey(): Promise<CryptoKey> {
  const key = await importKeyFrom(ENV_KEY);
  if (!key) {
    throw new Error(`${ENV_KEY} is not set; cannot encrypt or decrypt signing secrets`);
  }
  return key;
}

async function decryptWith(key: CryptoKey, blob: string): Promise<string> {
  const combined = base64ToBytes(blob);
  const iv = combined.slice(0, IV_BYTES);
  const ciphertext = combined.slice(IV_BYTES);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );
  return new TextDecoder().decode(plaintext);
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await primaryKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const data = new TextEncoder().encode(plaintext);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data as BufferSource),
  );
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.length);
  return bytesToBase64(combined);
}

// Decrypt with the primary key, falling back to the previous key during a rotation window. The
// AES-GCM auth tag makes a wrong-key attempt throw, so the fallback is safe: it only succeeds
// when the blob was encrypted under the previous key.
export async function decryptSecret(blob: string): Promise<string> {
  const key = await primaryKey();
  try {
    return await decryptWith(key, blob);
  } catch (primaryErr) {
    const previous = await importKeyFrom(ENV_KEY_PREVIOUS);
    if (!previous) throw primaryErr;
    return await decryptWith(previous, blob);
  }
}

// Generate an outbound signing secret for a source (P2). Uses crypto.getRandomValues, so it
// must run only in an action/httpAction context. The `esnk_` prefix marks it as an Eventsnare
// outbound signing key, mirroring provider conventions (whsec_, etc.).
export function generateOutboundSecret(): string {
  // 32 bytes (256 bits) to match the HMAC-SHA256 output width.
  return `esnk_${bytesToHex(crypto.getRandomValues(new Uint8Array(32)))}`;
}
