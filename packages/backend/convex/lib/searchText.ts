// Derived search haystack for the event full-text index (P4). Combines the event's metadata
// with a length-capped prefix of the inline body. Large payloads stored in File Storage are
// intentionally excluded — the dashboard surfaces this limit so users know search covers
// metadata + inline-body prefix only, not full large-payload contents.

// Cap on the inline-body slice folded into searchText. Convex search indexes truncate very long
// fields; keeping the contribution bounded also keeps the index small and writes cheap.
const BODY_PREFIX_CHARS = 1024;

export function buildSearchText(
  eventType: string,
  providerEventId: string,
  rawBodyInline?: string,
): string {
  const parts = [eventType, providerEventId];
  if (rawBodyInline) parts.push(rawBodyInline.slice(0, BODY_PREFIX_CHARS));
  return parts.filter(Boolean).join(' ');
}
