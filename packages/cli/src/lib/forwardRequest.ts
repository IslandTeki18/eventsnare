// Forward one webhook to the local URL, byte-for-byte. The headers come from the backend already
// fully built (the X-Eventsnare-* set, the outbound signature, any custom forward headers), so we
// pass them through unchanged. The body is either an inline string or fetched from a storage URL;
// either way it is sent verbatim.

const FORWARD_TIMEOUT_MS = 30_000;

export interface ForwardResult {
  statusCode?: number;
  errorMessage?: string;
  latencyMs: number;
}

async function resolveBody(
  body: string | null,
  bodyStorageUrl: string | null,
): Promise<string> {
  if (body !== null) return body;
  if (bodyStorageUrl) {
    const res = await fetch(bodyStorageUrl);
    return await res.text();
  }
  return '';
}

export async function forwardToLocal(args: {
  url: string;
  headers: Record<string, string>;
  body: string | null;
  bodyStorageUrl: string | null;
}): Promise<ForwardResult> {
  const body = await resolveBody(args.body, args.bodyStorageUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const res = await fetch(args.url, {
      method: 'POST',
      headers: args.headers,
      body,
      signal: controller.signal,
    });
    return { statusCode: res.status, latencyMs: Date.now() - startedAt };
  } catch (err) {
    return {
      errorMessage: err instanceof Error ? err.message : 'Local forward failed',
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}
