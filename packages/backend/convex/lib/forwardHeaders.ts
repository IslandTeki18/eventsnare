// Custom forward-header rules (P2). Custom headers are added to every forwarded request, but
// they must never override the headers Eventsnare controls (the X-Eventsnare-* metadata set,
// the outbound signature, or transport headers). Validation runs at the source mutation; the
// delivery action also skips reserved names defensively when merging.

export const RESERVED_HEADER_PREFIX = 'x-eventsnare-';

const RESERVED_EXACT = new Set(['content-type', 'content-length', 'host']);

export function isReservedForwardHeader(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return lower.startsWith(RESERVED_HEADER_PREFIX) || RESERVED_EXACT.has(lower);
}

// Throws on the first invalid header. Names must be non-empty HTTP tokens and not reserved.
export function validateForwardHeaders(headers: Record<string, string>): void {
  for (const name of Object.keys(headers)) {
    if (!name.trim()) throw new Error('Header name cannot be empty');
    if (!/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(name)) {
      throw new Error(`Invalid header name: ${name}`);
    }
    if (isReservedForwardHeader(name)) {
      throw new Error(`Header "${name}" is reserved and cannot be overridden`);
    }
  }
}
