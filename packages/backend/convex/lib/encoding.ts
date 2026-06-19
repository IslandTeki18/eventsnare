// Byte encoding helpers shared across crypto and provider HMAC code. Pure functions with no
// runtime dependencies, so any module may import them without creating a layering cycle.

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i]!.toString(16).padStart(2, '0');
  return hex;
}
