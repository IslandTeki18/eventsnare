// Verified-phone helpers for free-tier abuse prevention. The phone is HMAC'd with a
// server-side pepper (PHONE_HASH_KEY) so the ledger is a one-way membership set, never a
// plaintext PII log. Phone numbers carry ~10 digits of entropy, so a plain hash is
// brute-forceable; HMAC with a secret pepper is not. Hashing uses crypto.subtle and is
// therefore action/httpAction-only (called once from the Clerk webhook).

import { hmacSha256, toHex } from '../providers/hmac';

export async function hashPhone(e164: string, key: string): Promise<string> {
  return toHex(await hmacSha256(key, e164));
}

interface ClerkPhone {
  phone_number?: string;
  verification?: { status?: string } | null;
}

// First verified phone from a Clerk user payload, in E.164 (Clerk's canonical form), trimmed.
// Returns null when no phone is verified.
export function extractVerifiedPhone(phoneNumbers: ClerkPhone[] | undefined): string | null {
  const verified = phoneNumbers?.find((p) => p.verification?.status === 'verified');
  const num = verified?.phone_number?.trim();
  return num ? num : null;
}
