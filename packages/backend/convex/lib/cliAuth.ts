// CLI device-token helpers (P5). Token generation uses crypto.getRandomValues and hashing uses
// crypto.subtle.digest; both are only available in action/httpAction contexts, so every function
// here must be called from an action, never a query or mutation. Tokens are bearer credentials:
// only their SHA-256 hash is ever persisted (see cli-auth/schema), and lookups hash the presented
// token and compare against the stored hash.

import { bytesToHex } from './encoding';

// `escli_` marks an Eventsnare CLI token, mirroring the provider-key prefix convention
// (whsec_, esnk_). The visible prefix stored for display is the literal marker plus the first
// 8 hex chars of the random body, e.g. `escli_ab12cd34`.
const TOKEN_MARKER = 'escli_';

export interface GeneratedCliToken {
  token: string;
  prefix: string;
}

// 32 random bytes (256 bits) hex-encoded, prefixed. Action context only.
export function generateCliToken(): GeneratedCliToken {
  const body = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  return { token: `${TOKEN_MARKER}${body}`, prefix: `${TOKEN_MARKER}${body.slice(0, 8)}` };
}

// SHA-256 hex of the raw token. Action context only (crypto.subtle).
export async function hashCliToken(rawToken: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawToken) as BufferSource,
  );
  return bytesToHex(new Uint8Array(digest));
}

// Opaque per-session secret (capability) the CLI must echo back on every call after register.
// Action context only.
export function generateSessionSecret(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(24)));
}
