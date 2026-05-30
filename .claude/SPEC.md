# Eventsnare — Product & Technical Specification

**Version:** 0.1 (Pre-MVP)
**Status:** Draft
**Last updated:** 2026-05-26
**Owner:** Solo founder
**Codename:** Eventsnare (working title; subject to change before launch)

---

## 1. Executive Summary

Eventsnare is a hosted webhook reliability service. Customers point third-party webhook providers (Stripe, GitHub, Shopify, Clerk, Resend, and others) at a Eventsnare ingress URL. Eventsnare verifies the signature, durably persists the event, and reliably delivers it to the customer's own endpoint with retries, deduplication, and a one-click replay dashboard.

**Primary user:** Solo founders and small-team SaaS builders, especially those shipping AI-generated codebases ("vibe coders") whose webhook handlers are silently dropping events.

**Primary value proposition:** "Webhooks that survive your AI-generated code. Drop our URL into Stripe, GitHub, or Shopify and never lose another event."

**Monetization:** SaaS subscription with usage-tiered pricing. Free tier (10K events/mo), then $29 / $99 / $299 / $999 monthly tiers.

**Build target:** Solo developer. MVP shippable in 6 weeks of focused work. Public launch within 10 weeks of project start.

---

## 2. Goals and Non-Goals

### 2.1 Goals (v1.0)

1. Receive webhook events from at least 10 named providers and verify their signatures correctly.
2. Durably persist every received event such that, once a 2xx is returned to the provider, the event cannot be lost.
3. Deliver each event to a customer-configured forward URL, retrying on failure with exponential backoff, until success or dead-letter.
4. Provide a dashboard where customers can list, filter, inspect, and replay events.
5. Bill customers via Stripe subscriptions with usage-based tier enforcement.
6. Achieve 99.9% ingress availability and <200ms p95 ingress latency.
7. Onboard a new customer (signup → first event delivered) in under 10 minutes.

### 2.2 Non-Goals (v1.0)

1. Outbound webhook fan-out for customers sending webhooks to *their* users (Svix's market — explicitly out of scope).
2. Generic durable workflow execution (Inngest/Trigger.dev's market — out of scope).
3. Custom transformation, filtering, or routing rules (consider for v2).
4. Multi-region active-active deployment (single region acceptable for v1).
5. SOC 2 / HIPAA compliance (defer to v2 when enterprise demand arrives).
6. Customer-facing API for programmatic event management (defer to v2).
7. Webhook generation/publishing on behalf of customers (out of scope).

### 2.3 Explicit Constraints

- Built and maintained by one developer.
- Total monthly infrastructure cost must remain under $200/mo at 200 customers.
- No external funding assumed; product must reach $5K MRR before any meaningful infrastructure scale-out.
- All third-party services chosen must offer a meaningful free tier or low-cost entry point.

---

## 3. Target Users and Use Cases

### 3.1 Primary persona — "Sarah the indie SaaS founder"

- Built her SaaS in Cursor / Lovable / v0 over weekends.
- 30–500 paying customers, ~$1K–$15K MRR.
- Stack typically: Next.js on Vercel, Postgres on Supabase or Neon, Stripe for billing.
- Pain: silent webhook failures she discovers weeks later through customer support tickets.
- Willingness to pay: $19–$99/mo for an obviously-valuable infrastructure service.
- Sensitivities: hates sales calls, hates self-hosting, distrusts opaque pricing.

### 3.2 Secondary persona — "Marcus the small startup CTO"

- Engineering team of 2–10.
- ~$20K–$200K MRR business.
- Has tried Hookdeck or considered Svix; found both either too expensive or too enterprise-focused.
- Pain: webhook handling spread across multiple services, no unified visibility.
- Willingness to pay: $99–$499/mo for the right product.
- Wants: SSO, audit log, role-based access, EU data residency option.

### 3.3 Use cases (in priority order)

1. **Stripe webhook reliability** — Sarah loses revenue when `subscription.deleted` events silently fail. (~50% of v1 customers)
2. **GitHub webhook handling** — A DevTools startup needs reliable CI triggers from GitHub push events. (~15%)
3. **Shopify webhook handling** — A small e-commerce app loses order events during deploys. (~10%)
4. **Multi-provider consolidation** — A SaaS with 5+ webhook sources wants one dashboard. (~15%)
5. **Resend / email-event tracking** — Transactional email events feeding into analytics. (~10%)

---

## 4. Functional Requirements

### 4.1 Account and Authentication

| ID | Requirement |
|----|-------------|
| FR-AUTH-1 | Users sign up via GitHub OAuth or email + password (powered by Clerk). |
| FR-AUTH-2 | Each user has one workspace at signup; multi-workspace support deferred to v2. |
| FR-AUTH-3 | Workspaces have a single owner role in v1; full RBAC deferred. |
| FR-AUTH-4 | Email verification required before creating webhook sources. |
| FR-AUTH-5 | Password reset and account deletion supported via Clerk's hosted flows. |

### 4.2 Webhook Sources (Inbound)

| ID | Requirement |
|----|-------------|
| FR-SRC-1 | A user can create a webhook source by selecting a provider from a pre-built list. |
| FR-SRC-2 | Each source receives a unique ingress URL of the form `https://hooks.eventsnare.dev/in/{workspace_slug}/{source_id}`. |
| FR-SRC-3 | The user provides the signing secret obtained from the provider; Eventsnare encrypts it at rest. |
| FR-SRC-4 | The user configures a forward URL (where Eventsnare will deliver verified events). |
| FR-SRC-5 | A source can be paused/resumed without losing pending events. |
| FR-SRC-6 | A source can be deleted; this soft-deletes after 30 days for data recovery. |
| FR-SRC-7 | Providers supported at v1 launch: Stripe, GitHub, Shopify, Clerk, Resend. |
| FR-SRC-8 | Providers added in first 60 days post-launch: Twilio, Calendly, Polar, Lemon Squeezy, Linear (total: 10). |

### 4.3 Event Ingress and Verification

| ID | Requirement |
|----|-------------|
| FR-IN-1 | The ingress endpoint accepts POST requests and returns 2xx within 200ms p95. |
| FR-IN-2 | Each provider's signature scheme is correctly implemented (HMAC variant, header name, secret handling). |
| FR-IN-3 | Events failing signature verification are persisted with `signature_valid=false` and not delivered, but are visible in the dashboard for debugging. |
| FR-IN-4 | Once a 2xx is returned to the provider, the event MUST be durably persisted (i.e., visible after any restart). |
| FR-IN-5 | Duplicate detection: events with the same `(source_id, provider_event_id)` are deduplicated; the first wins. |
| FR-IN-6 | Raw request body, headers, source IP, and timestamp are all stored. |
| FR-IN-7 | Per-source rate limit: 1,000 events/sec sustained, 5,000 events/sec burst. Excess returns 429 to provider. |

### 4.4 Event Delivery (Forwarding)

| ID | Requirement |
|----|-------------|
| FR-OUT-1 | Each verified event is enqueued for delivery to the source's forward URL. |
| FR-OUT-2 | First delivery attempt occurs within 1 second p50, 10 seconds p99 of ingress. |
| FR-OUT-3 | Forwarded request preserves the original provider's body byte-for-byte. |
| FR-OUT-4 | Eventsnare adds metadata headers: `X-Eventsnare-Event-Id`, `X-Eventsnare-Attempt`, `X-Eventsnare-Source`, `X-Eventsnare-Original-Signature`. |
| FR-OUT-5 | Delivery is considered successful on 2xx response from customer endpoint. |
| FR-OUT-6 | On failure, retry with exponential backoff: 10s, 30s, 2m, 10m, 1h, 6h, 24h. After 7 attempts, dead-letter the event. |
| FR-OUT-7 | Delivery timeout: 30 seconds per attempt. |
| FR-OUT-8 | Customers can configure max retry count (1–7) per source. |
| FR-OUT-9 | Events in dead-letter state remain available for manual replay for 30 days. |

### 4.5 Dashboard

| ID | Requirement |
|----|-------------|
| FR-DASH-1 | Event list view with filtering by source, status, date range, and event type. |
| FR-DASH-2 | Event detail view showing: provider, event ID, timestamp, signature status, all delivery attempts with status codes and response bodies. |
| FR-DASH-3 | One-click "Replay" button on any event triggers a new delivery attempt. |
| FR-DASH-4 | Bulk replay: select multiple events and replay all. |
| FR-DASH-5 | Source management page: add, edit, pause, delete sources. |
| FR-DASH-6 | Settings page: alerting email, Slack webhook for alerts, account info. |
| FR-DASH-7 | Usage page showing current month's event count, plan limit, and overage warnings at 80% and 100%. |
| FR-DASH-8 | Real-time event stream (WebSocket or SSE) on the event list page. |

### 4.6 Alerting

| ID | Requirement |
|----|-------------|
| FR-ALERT-1 | Email alert when a source has failed >10 deliveries in a 5-minute window. |
| FR-ALERT-2 | Email alert when an event hits dead-letter state. |
| FR-ALERT-3 | Email alert at 80%, 100%, 110% of monthly event quota. |
| FR-ALERT-4 | Slack alert (via customer-provided webhook URL) for the same triggers as email. |
| FR-ALERT-5 | Customers can disable individual alert types. |

### 4.7 Billing

| ID | Requirement |
|----|-------------|
| FR-BILL-1 | Stripe Billing integration for subscription management. |
| FR-BILL-2 | Plans: Free, Indie ($29), Startup ($99), Growth ($299), Pro ($999). |
| FR-BILL-3 | Free tier: hard cap at 10K events/mo; no overage allowed. |
| FR-BILL-4 | Paid tiers: hard cap at plan limit by default; user can opt into overages at $0.50 per 1,000 events. |
| FR-BILL-5 | Annual plans offered at 2 months free (16.7% discount). |
| FR-BILL-6 | Customer portal access for invoice history and payment method updates. |
| FR-BILL-7 | Cancellation does not delete data; data retained for 60 days, then permanently deleted. |

---

## 5. Pricing and Plans

| Plan | Price | Events/mo | Sources | Retention | Features |
|------|-------|-----------|---------|-----------|----------|
| Free | $0 | 10,000 | 2 | 7 days | All providers, basic dashboard, email alerts |
| Indie | $29/mo | 250,000 | 10 | 30 days | + Slack alerts, replay, bulk operations |
| Startup | $99/mo | 2,000,000 | 50 | 60 days | + Anomaly detection, API access (v2), 99.95% SLA |
| Growth | $299/mo | 10,000,000 | Unlimited | 90 days | + Audit log, team seats (up to 5), priority support |
| Pro | $999/mo | 50,000,000 | Unlimited | 1 year | + SSO/SAML, EU data residency, custom retention, SLA-backed |

**Annual discount:** 2 months free on all paid plans.

**Overages:** $0.50 per 1,000 events on Indie/Startup/Growth; opt-in only; hard-cap default.

---

## 6. Non-Functional Requirements

### 6.1 Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-REL-1 | Ingress availability | 99.9% measured monthly (excluding scheduled maintenance) |
| NFR-REL-2 | Event durability | 100% — once 2xx returned to provider |
| NFR-REL-3 | Ingress latency | p95 < 200ms, p99 < 500ms |
| NFR-REL-4 | First-delivery latency | p50 < 1s, p99 < 10s |
| NFR-REL-5 | Dashboard availability | 99.5% |

### 6.2 Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-1 | All traffic in transit over TLS 1.2+. |
| NFR-SEC-2 | Signing secrets encrypted at rest using AES-256 (application-layer encryption before write to Convex; key material in Convex environment variables). |
| NFR-SEC-3 | All admin actions logged with actor, action, timestamp, and IP. |
| NFR-SEC-4 | No production database access from local developer machines; bastion-only. |
| NFR-SEC-5 | Stripe and other API keys stored in environment-managed secret stores; never in code. |
| NFR-SEC-6 | Bcrypt or Argon2 for password hashing (delegated to Clerk in v1). |
| NFR-SEC-7 | OWASP Top 10 considerations addressed at code review time. |
| NFR-SEC-8 | Public-facing pages have a published security disclosure policy (security.txt). |

### 6.3 Privacy and Data Handling

| ID | Requirement |
|----|-------------|
| NFR-PRIV-1 | Webhook payloads may contain customer PII (e.g., Stripe customer emails); treated as confidential. |
| NFR-PRIV-2 | GDPR-compliant data export and deletion offered. |
| NFR-PRIV-3 | Free-tier payload retention: 7 days; paid-tier retention per plan. |
| NFR-PRIV-4 | Sub-processors disclosed publicly: Cloudflare, Convex, Vercel, Clerk, Stripe, Resend (email). |
| NFR-PRIV-5 | EU data residency option deferred to Pro tier (v1.1). |

### 6.4 Observability

| ID | Requirement |
|----|-------------|
| NFR-OBS-1 | Structured logs (JSON) for all ingress and delivery events. |
| NFR-OBS-2 | Metrics: events per minute, delivery success rate, p95/p99 latencies, queue depth. |
| NFR-OBS-3 | Error tracking via Sentry (free tier). |
| NFR-OBS-4 | Public status page (Statuspage.io free tier or self-hosted). |
| NFR-OBS-5 | Internal alerting (Slack/email) on: ingress error rate >1%, delivery queue depth >10K, p99 latency >1s. |

### 6.5 Cost

| ID | Requirement |
|----|-------------|
| NFR-COST-1 | Infrastructure cost <$50/mo for first 50 customers. |
| NFR-COST-2 | Infrastructure cost <$200/mo for first 200 customers. |
| NFR-COST-3 | Unit economics: gross margin >75% per customer at the Indie tier. |

---

## 7. Architecture

### 7.1 High-Level Component Diagram

```
┌────────────────────┐
│ Provider (Stripe,  │
│ GitHub, Shopify…)  │
└─────────┬──────────┘
          │ HTTPS POST
          ▼
┌────────────────────────────┐
│ Cloudflare Workers Ingress │  ← signature verification, dedupe check
└─────────┬──────────────────┘
          │
          ▼
┌────────────────────────────┐      ┌──────────────────────┐
│ Convex Database            │◄─────┤ Convex File Storage  │
│   events, sources,         │      │   raw payload blobs  │
│   workspaces, attempts…    │      │   (>100KB payloads)  │
└─────────┬──────────────────┘      └──────────────────────┘
          │ event_id
          ▼
┌────────────────────────────┐
│ Convex Scheduler           │  ← ctx.scheduler.runAfter, backoff
└─────────┬──────────────────┘
          │
          ▼
┌────────────────────────────┐
│ Convex Delivery Action     │  ← retry logic, exponential backoff
└─────────┬──────────────────┘
          │ HTTPS POST
          ▼
┌────────────────────────────┐
│ Customer's Forward URL     │
└────────────────────────────┘

┌────────────────────────────┐
│ Next.js Dashboard (Vercel) │  ← reads from Convex, triggers replays
└────────────────────────────┘
```

### 7.2 Component Responsibilities

**Ingress (Cloudflare Workers):**
- Receive POST request at `/in/{workspace_slug}/{source_id}`.
- Look up source config (cached in Workers KV with 60s TTL).
- Verify provider signature using the source's signing secret.
- Compute event fingerprint `(source_id, provider_event_id)` for dedup.
- Write event row to Convex via mutation; upload raw body to Convex File Storage if >100KB.
- Schedule first delivery attempt via Convex Scheduler.
- Return 2xx to provider.
- Hard SLA: respond within 10s (Stripe's timeout) or 30s (GitHub's). Target: 200ms p95.

**Convex Database:**
- Source of truth for all metadata: users, workspaces, sources, events, delivery attempts.
- Stores event payloads under 100KB inline on the `events` document; larger payloads stored as a Convex File Storage ID reference.
- Indexes (Convex `defineTable().index(...)`):
  - `by_source_received` on `(source_id, received_at)` for the dashboard event list.
  - `by_provider_event` on `(source_id, provider_event_id)` (unique) for dedup.
  - `by_status_next_attempt` on `(status, next_attempt_at)` for dead-letter sweeps and audit.

**Convex File Storage:**
- Large payloads (>100KB) and full original headers.
- Stored as opaque blobs referenced by `storage_id` on the event row.
- Retention managed by cron job aligned with the workspace's plan tier (7 / 30 / 60 / 90 / 365 days).

**Delivery scheduling:**
- No standalone queue. Convex's built-in scheduler (`ctx.scheduler.runAfter(delayMs, internal.delivery.attempt, { eventId })`) durably enqueues each retry.
- Backoff schedule: 10s, 30s, 2m, 10m, 1h, 6h, 24h.
- Scheduled work is durable across deployments and Convex restarts.

**Convex Delivery Action:**
- An `internalAction` invoked by the scheduler with the event ID.
- Loads the event, reconstructs the original body (inline or from File Storage), performs HTTPS POST to the forward URL with 30s timeout.
- On 2xx: mutation marks delivered.
- On non-2xx or timeout: mutation increments `attempt_count`, computes next delay, calls `ctx.scheduler.runAfter` for the next attempt. After 7 attempts: dead-letter.
- Outbound concurrency bounded by the Convex Workpool component (default 50 in-flight per workspace).

**Dashboard (Next.js on Vercel):**
- Server components for SSR.
- Reads events through the Convex React client; queries are reactive by default.
- Replay action: mutation that resets status and calls `ctx.scheduler.runAfter(0, internal.delivery.attempt, ...)`.

### 7.3 Provider Library

The provider library is the single most important moat. Each supported provider implements a uniform interface:

```typescript
interface ProviderAdapter {
  name: string;
  verifySignature(req: IncomingRequest, secret: string): VerificationResult;
  extractEventId(body: string, headers: Headers): string;
  extractEventType(body: string, headers: Headers): string;
  // optional:
  parseTimestamp?(headers: Headers): Date | null;
}
```

Each provider lives in `src/providers/{name}.ts` with comprehensive tests against captured fixture payloads.

**Provider rollout schedule:**
- Launch (week 8): Stripe, GitHub, Shopify, Clerk, Resend.
- Week 10–12: Twilio, Calendly, Polar, Lemon Squeezy, Linear.
- Month 4–6: Slack, Discord, Notion, Linear, Vercel, Sentry, Sanity, Webflow, Cal.com, Loops.
- Month 7+: customer-requested providers; add one every 2 weeks indefinitely.

### 7.4 Technology Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Ingress | Cloudflare Workers | Global low-latency edge, generous free tier, cheap at scale |
| Database | Convex | Transactional document store with reactive queries; collapses DB + scheduler + storage + real-time into one vendor |
| Object storage | Convex File Storage | Native blob store referenced by storage ID; no separate egress cost or auth surface |
| Queue | Convex Scheduler (`ctx.scheduler.runAfter`) | Durable scheduled work; no separate queue infrastructure to operate |
| Delivery worker | Convex internal actions + Workpool component | Auto-scaling, durable, no long-running host to manage |
| Dashboard | Next.js on Vercel | Free tier, fast iteration, server components |
| Auth | Clerk | Free up to 10K MAU, removes auth as a category of work |
| Payments | Stripe Billing | Industry default, dogfooding (we receive Stripe webhooks) |
| Email | Resend | Cheap, clean API, also a dogfood opportunity |
| Error tracking | Sentry | Free tier sufficient at our scale |
| Status page | Statuspage.io or Instatus | Free tier |
| Analytics | Plausible | Privacy-friendly, cheap |

---

## 8. Data Model (Reference)

> The schema below is illustrative; exact column types and constraints are finalized during build.

**users** — id, email, clerk_id, created_at
**workspaces** — id, owner_user_id, slug, name, plan, plan_renews_at, stripe_customer_id, created_at
**sources** — id, workspace_id, provider, name, ingress_path, signing_secret_encrypted, forward_url, status (active/paused/deleted), max_retries, created_at
**events** — id, source_id, provider_event_id, event_type, signature_valid, raw_body_inline OR raw_body_storage_id (Convex File Storage), received_at, status (received/queued/delivering/delivered/failed/dead_letter), attempt_count, next_attempt_at, dead_letter_at
**delivery_attempts** — id, event_id, attempt_number, started_at, completed_at, status_code, response_body_truncated, error_message
**alerts** — id, workspace_id, type, channel, enabled, target (email or slack webhook url)
**usage_counters** — workspace_id, billing_period, event_count (updated atomically on ingress)

**Convex indexes worth calling out:**
- `by_source_received` on `(source_id, received_at)` for the dashboard event list.
- `by_provider_event` on `(source_id, provider_event_id)` UNIQUE for dedup.
- `by_status_next_attempt` on `(status, next_attempt_at)` for dead-letter sweeps and audit (delivery itself is push-driven via the scheduler, not polled).
- `by_workspace_received` on `(workspace_id, received_at)` for cross-source views.

---

## 9. Key API Endpoints (Internal)

The dashboard and worker communicate with the database directly. There is no public REST API for v1. The only public HTTP surface is:

- `POST /in/{workspace_slug}/{source_id}` — ingress endpoint, accepts any body, returns 2xx on success.
- `GET /healthz` — health check.
- `GET /v1/status` — public status (also surfaced on status page).

Dashboard-internal routes (Next.js server actions or tRPC):
- List events, get event detail, replay event(s), pause/resume source, update forward URL, rotate signing secret, manage alerts, view usage.

A public REST API is on the v2 roadmap.

---

## 10. Onboarding Flow

Target: signup → first event delivered in <10 minutes.

1. **Sign up** via GitHub OAuth (one click) or email + password.
2. **Verify email** (skipped if OAuth).
3. **Pick a provider** from a visual grid (Stripe is first, biggest, with a "Most Popular" tag).
4. **Provider-specific guide:** screenshots showing where to paste the Eventsnare URL in the provider's dashboard, where to copy the signing secret.
5. **Paste signing secret + forward URL** into Eventsnare.
6. **Send test event** button — Eventsnare pings the customer's forward URL with a fake event to verify connectivity.
7. **Trigger a real event** (e.g., a test Stripe event from Stripe's dashboard) — event appears in real-time on Eventsnare dashboard with green checkmark.
8. **Done.** Customer is now relying on Eventsnare.

---

## 11. Critical Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Cloudflare Workers outage causes ingress downtime | Low | High | Document fallback URL providers can be temporarily repointed to (manual); accept the risk for v1 |
| Provider changes signature scheme without notice | Medium | High | Maintain fixture test suite per provider; subscribe to provider changelogs; monitor signature error rates |
| Convex goes down | Low | High | Rely on Convex's managed redundancy; accept single-region risk for v1; document fallback ingress URL providers can be repointed to if outage extends |
| Bad deploy drops events | Medium | High | Blue/green deploys via Cloudflare; canary 1% of traffic; rollback script tested |
| Customer's forward URL becomes a black hole, queue fills up | Medium | Medium | Per-source delivery concurrency limit; dead-letter at 7 attempts |
| Hookdeck or Svix ships an indie tier | Medium | Medium | Speed of provider library expansion; brand among indie devs; consider partnership/acquisition if competition intensifies |
| Stripe ships native webhook DLQ/replay | Medium | Medium | Multi-provider design from day one; not single-source-of-failure on Stripe |
| Solo founder burnout | High | Existential | Realistic time budget (15h/week sustained); celebrate small wins; do not hire prematurely; sabbatical after launch |
| Customer payload contains PII subject to GDPR | High | Medium | Encrypt at rest, retention limits, DPA template, sub-processor list |

---

## 12. Operational Runbook (Excerpt)

This section will expand once the service is live. Initial entries:

**Ingress 5xx rate >1%:**
1. Check Cloudflare Workers status.
2. Check Convex dashboard for function execution failures, throttling, or capacity warnings.
3. Check Sentry for new exception types.
4. If unresolvable in 10 minutes, post to status page.

**Scheduled-attempt backlog growing (events stuck in `queued` / `delivering`):**
1. Open the Convex dashboard, inspect scheduled functions and recent action failures.
2. Check if a single customer's forward URL is failing repeatedly; pause that source or tighten its Workpool concurrency.
3. If the backlog is broad (multiple sources affected), check Convex function execution limits and contact Convex support if hitting plan ceilings.

**Customer reports missing event:**
1. Look up event by `(source_id, provider_event_id)` in Convex.
2. If not present: signature failed or provider didn't send — check ingress logs.
3. If present but not delivered: inspect delivery attempts, replay manually.

**Provider signature scheme changed:**
1. Provider returns new signature error rate spike.
2. Hotfix adapter in `src/providers/{name}.ts`.
3. Backfill: re-verify recent events and re-deliver if previously rejected.

---

## 13. Open Questions

These need decisions before or during build:

1. **Queue choice for v1**: Resolved 2026-05-27 — Convex Scheduler (`ctx.scheduler.runAfter`) replaces both Postgres SKIP LOCKED and Cloudflare Queues; no standalone queue or worker host required.
2. **Signing secret rotation**: How is this surfaced when a customer rotates a Stripe secret? Manual paste vs API integration.
3. **Per-event size limit**: 1MB? 10MB? Most providers cap themselves, but extreme cases?
4. **Free tier abuse**: How to prevent users creating dozens of free workspaces? Rate-limit signups, require credit card on free tier, or accept the risk.
5. **EU data residency**: Architect for it from day one (more cost) or punt to v1.1?
6. **SLA credits**: How are downtime credits calculated and applied? Defer to v1.1 along with paid SLA tier.
7. **Domain choice**: eventsnare.dev, eventsnare.io, getsetfetch, or rebrand entirely before launch?

---

## 14. v2 Roadmap (Not Yet Specified)

Items deliberately out of scope for v1 but anticipated in v2:

- Public REST API for programmatic event management.
- Custom transformation rules (jq-style payload reshaping).
- Filtering rules (only forward events matching criteria).
- Multi-destination fan-out (one inbound event → multiple forward URLs).
- AI-powered anomaly detection (event volume, latency, error patterns).
- SOC 2 Type II.
- Outbound webhook publishing (compete in Svix's lane — only if requested by enough customers).
- Customer-facing audit log API.
- Webhook replay scheduling ("replay this event at 9am tomorrow").

---

## 15. Success Metrics (v1.0)

By end of month 9 post-launch:

| Metric | Target |
|--------|--------|
| Paying customers | 250+ |
| MRR | $10,000+ |
| Monthly logo churn | <5% |
| NPS | >40 |
| p95 ingress latency | <200ms |
| Ingress availability | >99.9% |
| Customer-reported lost events | <5 per month |
| Provider count supported | 25+ |
| Average customer lifetime | >12 months projected |

---

## 16. Decision Log

> Track significant architectural and product decisions here as they're made.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-26 | Inbound-first, not outbound | Solo dev scope; clearer pain point; less competition at indie tier |
| 2026-05-26 | Cloudflare Workers for ingress | Cost, latency, global presence |
| 2026-05-26 | Postgres-backed queue for v1 | Avoid premature dependency on Cloudflare Queues |
| 2026-05-26 | Clerk for auth | Removes auth as a category of work |
| 2026-05-26 | 5 providers at launch | Stripe is non-negotiable; 4 more cover ~80% of indie use cases |
| 2026-05-27 | Convex replaces Postgres + R2 + queue + delivery worker host | Repo already scaffolded on Convex; collapses DB, file storage, durable scheduler, and outbound action runtime into one vendor; eliminates a long-running worker host. Cloudflare Workers retained for ingress to preserve edge p95 latency. Supersedes the 2026-05-26 "Postgres-backed queue" decision. |

---

*End of specification v0.1.*
