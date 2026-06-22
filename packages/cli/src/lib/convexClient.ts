// Convex client factories. One-shot commands (login, replay) use ConvexHttpClient; `listen` uses
// the WebSocket-backed ConvexClient so it can subscribe reactively to the pending-delivery queue.

import { ConvexClient, ConvexHttpClient } from 'convex/browser';

const DEFAULT_CONVEX_URL = process.env.EVENTSNARE_CONVEX_URL ?? '';

export function resolveUrl(explicit?: string): string {
  const url = explicit ?? DEFAULT_CONVEX_URL;
  if (!url) {
    throw new Error(
      'No Convex URL. Pass --url <https://...convex.cloud> or set EVENTSNARE_CONVEX_URL.',
    );
  }
  return url;
}

export function httpClient(url: string): ConvexHttpClient {
  return new ConvexHttpClient(url);
}

export function wsClient(url: string): ConvexClient {
  return new ConvexClient(url);
}
