// Provider adapter interface (SPEC §7.3). The provider library is the product's primary
// moat: each adapter knows one provider's signature scheme and how to pull the event id and
// type out of the request. Adapters are PURE — no Convex `_generated` imports — so they run
// inside the ingress httpAction and are unit-testable in isolation against captured fixtures.
//
// verifySignature is async because every scheme bottoms out in crypto.subtle (HMAC) or an
// async SDK verify.

export interface IncomingRequest {
  // Raw request body, byte-for-byte as received. Signatures are computed over these exact
  // bytes; never re-serialize before verifying.
  rawBody: string;
  headers: Headers;
}

export interface VerificationResult {
  valid: boolean;
  // Human-readable reason when invalid, surfaced in the dashboard for debugging (FR-IN-3).
  reason?: string;
}

export interface ProviderAdapter {
  name: string;
  verifySignature(req: IncomingRequest, secret: string): Promise<VerificationResult>;
  extractEventId(body: string, headers: Headers): string;
  extractEventType(body: string, headers: Headers): string;
  parseTimestamp?(headers: Headers): Date | null;
}
