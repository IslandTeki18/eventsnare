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

### P3 — Observability dashboard (per-source ops console)
Per-source and workspace charts (delivery success rate, volume, approximate latency p50/p95,
response-code breakdown, endpoint health), backed by an incrementally-maintained hourly rollup
so aggregation never scans `events`/`deliveryAttempts`.

- Schema: `deliveryStatsHourly` rollup table (`packages/backend/convex/ingress/schema.ts`)
- `lib/deliveryStats.ts` (+ test) — histogram-bucket latency aggregation, `bumpDeliveryStats`
  upsert, `percentileFromBuckets`
- Wired into both delivery paths: `delivery.ts` `recordAttemptResult` and `ingress.ts`
  `recordDeliverySuccess` (stress/simulated path)
- Queries: `analytics.ts` (`getSourceStats`, `getWorkspaceOverview`)
- UI: `apps/web/src/features/analytics/` (Recharts, Rose Pine themed); `/analytics` nav route;
  per-source Analytics tab in `SourceDetail.tsx`

### P4 — Payload + delivery search
Convex search index over a derived, length-capped `searchText` (eventType + providerEventId +
inline-body prefix) with structured equality filters (status, source, event type, last delivery
status code) denormalized onto the event row.

- Schema: `events.searchText` + `search_text` search index; denormalized `lastStatusCode` /
  `lastErrorMessage` (`ingress/schema.ts`)
- `lib/searchText.ts` (+ test) — `buildSearchText`; populated on the ingress persist path and
  refreshed via `recordAttemptResult`
- `events.search` query (`.withSearchIndex`); `events.list` extended with a `lastStatusCode`
  filter so the status-code filter works in browse mode
- Backfill: `searchTextMigration.ts` (paginated, idempotent)
- UI: search bar + status-code filter in `EventFilters.tsx`; `EventsList.tsx` switches between
  `events.list` (browse) and `events.search` (term present); coverage caption for large payloads

### Cross-cutting — crons
`crons.ts` created: bounded daily retention sweeps for `deliveryStatsHourly` and stale
`rateLimits` buckets.

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

## Required action before P2/P3/P4 ship

New Convex files (`secretsMigration.ts`, `analytics.ts`, `searchTextMigration.ts`, `crons.ts`)
and new schema fields/tables (`forwardHeaders*`, `outboundSigningSecretEncrypted`,
`deliveryStatsHourly`, `events.searchText` + `search_text` index, `events.lastStatusCode` /
`lastErrorMessage`) require a codegen + deploy before the new function references resolve, the
new columns exist, and the search index builds. Codegen needs project auth (not available to the
assistant). Run:

```
npx convex dev        # or: pnpm --filter @eventsnare/convex run codegen, then deploy
```

After deploy:

- **P2:** point a source at an echo endpoint (e.g. webhook.site), add an `Authorization` header,
  send a test event, confirm the header and `X-Eventsnare-Signature` arrive, and that the HMAC
  verifies against the revealed secret.
- **P4:** run the one-off backfill `npx convex run searchTextMigration:backfillSearchText`, then
  confirm existing events gain `searchText` and are returned by search.
- **P3:** drive events via the stress harness and confirm `deliveryStatsHourly` counts and
  derived p50/p95 reconcile against raw `deliveryAttempts`; confirm `/analytics` and the
  per-source Analytics tab render.

---

## Remaining

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

`crons.ts` is now implemented with bounded daily sweeps for the `deliveryStatsHourly` rollup and
stale `rateLimits` buckets. Event/payload retention per plan window (7/30/60/90/365 days) is not
yet wired into crons and remains follow-up work.

---

## Deferred / out of scope (do not build in v1)

Per SPEC §14: transformation rules, filtering rules, multi-destination fan-out, public REST API,
AI anomaly detection, audit-log API, SSO/SAML.

Operational items noted but not yet scheduled:
- Broader audit logging beyond secret reveals.
- Event/payload retention enforcement per plan window via cron.
