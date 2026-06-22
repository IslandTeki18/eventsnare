# Value Features — Status and Remaining Work

**Last updated:** 2026-06-22
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

### P5 — Local development forwarding CLI (flagship)
`eventsnare listen` forwards live webhooks to `localhost`, like the Stripe CLI. While a listen
session is active for a source, delivery is routed to the connected CLI instead of the production
forward URL (replace semantics); the event stays durably persisted and replayable. Local failures
are recorded but never enter the production retry/dead-letter schedule.

- Schema: `cli-auth/schema.ts` — `cliTokens` (SHA-256 hash only), `cliSessions` (heartbeat +
  capability secret), `localDeliveries` (per-session queue). Spread into root `schema.ts`.
- `lib/cliAuth.ts` (+ `lib/cliAuth.test.ts`) — token generation (`escli_` prefix), SHA-256
  hashing, session-secret generation (all action-context only).
- `cliTokens.ts` — Clerk-authed `issueToken`/`listTokens`/`revokeToken` (audited via
  `activityLogs`, rate-limited via `consumeRateLimit`); revoke cascades to end live sessions.
- `cliSessions.ts` — token-arg-authed `validateToken`/`listSources`/`registerSession`,
  `heartbeat`/`endSession`, and `findActiveSession` (the routing hook).
- `cliDelivery.ts` — `createLocalDelivery` (called from `delivery.attempt`), `pending` (reactive
  subscription target), `claimDelivery`/`ackDelivery` (records `deliveryAttempts` + `bumpDeliveryStats`,
  no backoff), `replayEvent`.
- `delivery.ts` — routing interception before the production `fetch`: active session → hand the
  fully-built request (byte-for-byte body + `X-Eventsnare-*` headers + signature) to the session
  queue and return.
- `crons.ts` — minutely sweeps: expire abandoned `localDeliveries` (reset stuck events) and end
  stale `cliSessions`.
- UI: `apps/web/src/features/cli-tokens/` (mint-once dialog, list, revoke); `/cli` nav route.
- CLI: `packages/cli` (`@eventsnare/cli`, bin `eventsnare`) — `login`/`listen`/`replay`,
  WebSocket subscription via `ConvexClient`, byte-for-byte forward with a 30s timeout.

### Cross-cutting — crons
`crons.ts` created: bounded daily retention sweeps for `deliveryStatsHourly` and stale
`rateLimits` buckets, plus minutely P5 sweeps for abandoned local deliveries and stale CLI
sessions.

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

## Required action before P2/P3/P4/P5 ship

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
- **P5:** new tables (`cliTokens`, `cliSessions`, `localDeliveries`) and functions
  (`cliTokens.*`, `cliSessions.*`, `cliDelivery.*`) need codegen + deploy before the web
  `/cli` screen and the CLI resolve. Then: mint a token in the dashboard, `eventsnare login
  --token <t> --url <deployment>`, `eventsnare listen --source <id> --forward
  http://localhost:3000/webhook`, send a test event, and confirm byte-for-byte arrival at
  localhost with the `X-Eventsnare-*` headers + `X-Eventsnare-Signature`; confirm the
  production forward URL is NOT hit; revoke the token and confirm the CLI exits within one
  heartbeat. The CLI builds against string function references (no backend codegen needed):
  `pnpm --filter @eventsnare/cli build`.

---

## Remaining

All five workstreams (P1–P5) are implemented. Remaining work is the codegen + deploy and the
end-to-end verification in "Required action before P2/P3/P4/P5 ship" above, plus the operational
follow-ups below.

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
