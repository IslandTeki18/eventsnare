// Application-layer encryption for source signing secrets (SPEC NFR-SEC-2).
//
// AES-256-GCM with a fresh 12-byte IV per encryption. The stored blob is base64 of
// (iv || ciphertext+tag). The key comes from the SECRETS_ENCRYPTION_KEY env var, a
// base64-encoded 32-byte (256-bit) key set via `npx convex env set`.
//
// IMPORTANT: these functions call crypto.getRandomValues (non-deterministic) and therefore
// MUST run only in action or httpAction contexts, never in a query or mutation.

const ENV_KEY = 'SECRETS_ENCRYPTION_KEY';
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

async function importKey(): Promise<CryptoKey> {
  const raw = process.env[ENV_KEY];
  if (!raw) {
    throw new Error(`${ENV_KEY} is not set; cannot encrypt or decrypt signing secrets`);
  }
  const keyBytes = base64ToBytes(raw);
  if (keyBytes.length !== 32) {
    throw new Error(`${ENV_KEY} must decode to 32 bytes (got ${keyBytes.length})`);
  }
  // Cast to BufferSource: lib.dom types a Uint8Array as Uint8Array<ArrayBufferLike>, which
  // is not structurally assignable to BufferSource under strict settings even though it is
  // valid at runtime.
  return await crypto.subtle.importKey('raw', keyBytes as BufferSource, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await importKey();
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

export async function decryptSecret(blob: string): Promise<string> {
  const key = await importKey();
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
