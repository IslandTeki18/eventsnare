# Value Features — Status and Remaining Work

**Last updated:** 2026-06-17
**Scope:** Differentiators that make the Indie ($29/mo) tier worth paying for, beyond the
spec's baseline (which the dashboard already implements in full).
**Source plan:** five-workstream roadmap (P1–P5), prioritized by impact-per-effort for a solo dev.

The Indie tier's spec features (source CRUD, event list/detail, delivery attempts, one-click +
bulk replay, email/Slack alerts, usage tracking, billing, onboarding) are all built. This
document tracks the work added on top to create stickiness and a concrete reason to pay.

---

## Done

### P1 — In-product provider setup docs
Structured, numbered, copyable connection guides per provider, with live ingress URL and docs
links. Surfaced on the create form, source detail, and onboarding verify step.

- `apps/web/src/features/sources/lib/providers.ts` — structured `steps` + `docsUrl`
- `apps/web/src/features/sources/components/ProviderSetupGuide.tsx`
- Wired into `SourceForm.tsx`, `SourceDetail.tsx`, `Onboarding.tsx`

### P2 — Outbound security: custom forward headers + Eventsnare-signed delivery
Encrypted custom headers added to every forwarded request (e.g. an `Authorization` bearer), and
an auto-generated outbound HMAC secret so customers can verify requests came from Eventsnare.

- Schema: `sources.forwardHeaders` (encrypted), `forwardHeaderKeys` (plaintext names),
  `outboundSigningSecretEncrypted` — `packages/backend/convex/ingress/schema.ts`
- `lib/crypto.ts` (`generateOutboundSecret`), `lib/forwardHeaders.ts` (+ test)
- `delivery.ts` — `X-Eventsnare-Signature: t=<ts>,v1=<hmac>`, reserved-header protection,
  fail-open on crypto/header errors
- `sources.ts` — header encode/validate, `rotateOutboundSecret`, audited reveal
- UI: `ForwardHeadersEditor.tsx`, `OutboundSecuritySettings.tsx`

### Review hardening (applied after code review of P1/P2)
- Signing failure is fail-open (never dead-letters an event)
- Header keys trimmed before validate/store; replay-protection guidance in verify snippet;
  save-error state; editor remount on saved-key change; 32-byte secret entropy; context-neutral
  guide copy
- Secret-reveal audit log (`activityLogs`) + rate limit (10 / 10 min per source) — new
  `rateLimits` table + `lib/rateLimit.ts`
- Key rotation: `SECRETS_ENCRYPTION_KEY_PREVIOUS` decrypt fallback + `secretsMigration.ts`
  re-encryption job + SPEC §12 runbook + `lib/crypto.test.ts`
- Hex helper consolidated into `lib/encoding.ts`; removed duplicated ingress-URL section

---

## Required action before P2 ships

`secretsMigration.ts` is a new Convex file and the P2 schema fields are new, so a codegen +
deploy is required for `internal.secretsMigration.*` to resolve and the new columns to exist.
Codegen needs project auth (not available to the assistant). Run:

```
npx convex dev        # or: pnpm --filter @eventsnare/convex run codegen, then deploy
```

After deploy, verify: point a source at an echo endpoint (e.g. webhook.site), add an
`Authorization` header, send a test event, confirm the header and `X-Eventsnare-Signature`
arrive, and that the HMAC verifies against the revealed secret.

---

## Remaining

### P3 — Observability dashboard (per-source ops console)
Per-source charts: delivery success rate over time, latency percentiles, volume, error-code
breakdown, endpoint health. Reframes the product as a webhook control plane.

- **Key decision:** live aggregation over `events`/`deliveryAttempts` does not scale at Indie
  volume (250K events/mo). Add a rollup table `deliveryStatsHourly`
  (workspaceId, sourceId, hourBucket, counts by status, latency p50/p95), maintained
  incrementally in `recordAttemptResult` (`delivery.ts`) rather than by scan.
- Queries: `analytics.getSourceStats`, `analytics.getWorkspaceOverview` over the rollup.
- UI: new `features/analytics/` with charts (pick a lightweight lib matching the Rose Pine
  theme); add to sidebar and a per-source tab in `SourceDetail`.
- **Effort:** ~5–7 days. **Risk:** medium (aggregation strategy, chart lib).
- **Verify:** drive events via the stress harness (`stressTest.ts`); confirm rollup counts and
  latency percentiles match raw `deliveryAttempts`; charts render.

### P4 — Payload + delivery search
The current paginated, post-index `.filter()` list (`events.ts`) is unusable for finding one
event at volume.

- **Key decision:** full-text over raw payloads is hard (>100KB bodies live in file storage).
  Use a Convex **search index** on a derived `searchText` field on `events`
  (eventType + providerEventId + a capped slice of the inline body), plus structured filters
  (status code, latency, error substring) joined from `deliveryAttempts`.
- Backfill `searchText` for existing rows (one-off migration); populate it in the ingress
  persist path going forward.
- Extend `events.list` (or add `events.search`) with `.withSearchIndex`; add a search bar +
  advanced filters to `EventsList` / `EventFilters.tsx`.
- Surface the limitation in the UI: search covers metadata + inline body prefix, not full
  large-payload contents.
- **Effort:** ~4–6 days. **Risk:** medium. Validate Convex search-index limits first.
- **Verify:** index a known set of events; confirm search by event type, provider event id,
  body prefix, and status-code filter; confirm backfill covered existing rows.

### P5 — Local development forwarding CLI (flagship)
`eventsnare listen` forwards live webhooks to `localhost`, like the Stripe CLI. Strongest reason
a developer pays and stays; largest build, so it ships last.

- New `packages/cli` (or `apps/cli`).
- Auth: CLI device-token flow — `cliTokens` table + issue/revoke mutations + a dashboard screen
  to mint a token.
- Transport: CLI long-polls or subscribes via the Convex client to a per-token delivery queue;
  backend routes delivery to an active local listener (reuse the scheduled-delivery model, add a
  local-listener target rather than rebuilding retry logic).
- Commands: `login`, `listen --source <id> --forward http://localhost:3000/webhook`, `replay`.
- Preserve byte-for-byte body and the `X-Eventsnare-*` headers as in `delivery.ts`.
- **Effort:** ~1.5–2 weeks. **Risk:** high (transport). Prototype Convex subscription vs
  long-poll before committing.
- **Verify:** `login`, `listen` against a test source, send a test event, confirm byte-for-byte
  arrival at localhost with correct headers; confirm token revoke stops delivery.

---

## Cross-cutting prerequisite

`crons.ts` (retention cleanup, dead-letter sweeps, usage rollups) is referenced in CLAUDE.md but
not yet implemented. P3's rollup table, P4's backfill, and the `rateLimits` stale-row sweep all
benefit from it. Create it when starting P3.

---

## Deferred / out of scope (do not build in v1)

Per SPEC §14: transformation rules, filtering rules, multi-destination fan-out, public REST API,
AI anomaly detection, audit-log API, SSO/SAML.

Operational items noted but not yet scheduled:
- Broader audit logging beyond secret reveals.
- `rateLimits` stale-bucket cleanup (cron) — harmless growth until then.
