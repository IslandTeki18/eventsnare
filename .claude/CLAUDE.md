# Eventsnare

Hosted webhook reliability service. Customers point third-party webhook providers (Stripe, GitHub, Shopify, Clerk, Resend, etc.) at an Eventsnare ingress URL. Eventsnare verifies the signature, durably persists the event, and reliably delivers it to the customer's own endpoint with retries, deduplication, and a one-click replay dashboard.

Full product and technical specification: `.claude/SPEC.md`. SPEC.md is authoritative for product behavior, requirements, and invariants. SPEC.md §7 was updated 2026-05-27 to use Convex for the database, large payload storage, scheduling/queue, and delivery worker; ingress in SPEC §7 remains Cloudflare Workers. This file is authoritative for the implementation stack as it actually stands today (notably: current ingress for customer webhooks runs as Convex HTTP Actions, not yet as a Cloudflare Worker — see Accepted Deviations).

---

## Project Status

- Version: 0.1 (pre-MVP).
- Solo developer. MVP target: 6 weeks of focused work, public launch within 10 weeks of project start.
- Infrastructure budget: under $200/mo at 200 customers.

---

## Authoritative Stack

CLAUDE.md is the source of truth for the stack. SPEC.md remains the source of truth for product behavior, functional requirements (§4), non-functional requirements (§6, with one accepted deviation noted below), data model (§8), and the provider adapter interface (§7.3).

| Layer | Technology |
|---|---|
| Backend: DB, functions, scheduler, file storage, real-time | Convex |
| Auth | Clerk, via `ConvexProviderWithClerk` |
| Billing | Stripe, via `packages/convex/stripe-payments` |
| Frontend | Vite + React + TypeScript (`apps/web`) |
| Marketing site | `apps/landing` |
| Shared UI | `packages/ui` |
| Shared types | `packages/types` |

Convex now owns the four backend layers SPEC §7 originally assigned to Neon Postgres, Cloudflare R2, a Postgres-SKIP-LOCKED queue, and a Fly.io-hosted delivery worker. SPEC §7 has been updated in place to reflect that. Cloudflare Workers remains the SPEC's ingress layer; in the current repo, ingress is implemented as Convex HTTP Actions (`packages/convex/http.ts`) — see Accepted Deviations. Provider adapter interface (SPEC §7.3) and data model (§8) carry over unchanged in spirit; storage backends shifted from Postgres/R2 to Convex tables and Convex file storage.

---

## Repository Layout

Turborepo monorepo, npm workspaces, Node `>=20`.

```
apps/
  web/        Dashboard (Vite + React + TypeScript), wired with ConvexProviderWithClerk.
  landing/    Marketing site.
packages/
  convex/     Backend: schema, queries, mutations, actions, HTTP handlers, crons, file storage.
  types/      Shared TypeScript types.
  ui/         Shared UI components (dark theme, Rose Pine preset).
```

Package manager: **pnpm** (via Corepack). Root scripts: `pnpm run dev`, `build`, `lint`, `typecheck`, `clean` (delegated through Turbo).

Key existing files:

- `packages/convex/schema.ts` — modular schema imports across feature domains.
- `packages/convex/auth.config.ts` — Clerk JWT issuer configuration.
- `packages/convex/http.ts` — existing HTTP routes for Clerk and Stripe webhooks; ingress and health/status routes go here.
- `apps/web/src/lib/convex.ts` — `ConvexReactClient` instantiation.
- `apps/web/src/main.tsx` — `ConvexProviderWithClerk` wiring.

---

## Core Domain Model

Authoritative definitions in SPEC §8. Translate to Convex tables, not Postgres tables.

- `users`, `workspaces` (one owner role in v1).
- `sources` — provider + encrypted signing secret + forward URL.
- `events` — received payload, signature status, status (`received | queued | delivering | delivered | failed | dead_letter`).
- `delivery_attempts` — per-retry record.
- `alerts`, `usage_counters`.

Critical invariants:

- Once a 2xx is returned to the provider, the event MUST be durably persisted. The HTTP action calls a mutation before returning.
- Dedup key: `(source_id, provider_event_id)`. First write wins. Enforced by unique compound index.
- Retry schedule: 10s, 30s, 2m, 10m, 1h, 6h, 24h. Dead-letter after 7 attempts. Per-source max configurable 1–7.
- Delivery timeout: 30s per attempt. Forwarded body is byte-for-byte identical to the original — no JSON re-serialization.
- Forwarded requests carry: `X-Eventsnare-Event-Id`, `X-Eventsnare-Attempt`, `X-Eventsnare-Source`, `X-Eventsnare-Original-Signature`.

---

## Public HTTP Surface (v1)

All three endpoints are Convex HTTP Actions registered in `packages/convex/http.ts` alongside the existing Clerk and Stripe handlers. No public REST API in v1.

- `POST /in/{workspace_slug}/{source_id}` — ingress. Accepts any body, returns 2xx after durable persistence.
- `GET /healthz` — health check.
- `GET /v1/status` — public status.

Everything else is dashboard-internal: Convex queries, mutations, and actions invoked from `apps/web` through the Convex client.

---

## Provider Library

The provider library is the primary moat. Each provider lives in `packages/convex/providers/{name}.ts` and implements the SPEC §7.3 interface:

```typescript
interface ProviderAdapter {
  name: string;
  verifySignature(req: IncomingRequest, secret: string): VerificationResult;
  extractEventId(body: string, headers: Headers): string;
  extractEventType(body: string, headers: Headers): string;
  parseTimestamp?(headers: Headers): Date | null;
}
```

Each adapter must have a fixture-based test suite using captured real payloads. Signature verification regressions are the highest-severity bug class in this codebase.

Launch providers (week 8): Stripe, GitHub, Shopify, Clerk, Resend.

---

## Non-Functional Targets

- Ingress availability: 99.9% monthly.
- Ingress latency: **p95 < 200ms from the provider's egress region** (regional, not global — see Accepted Deviations).
- First-delivery latency: p50 < 1s, p99 < 10s.
- Durability: 100% once 2xx returned.
- Per-source rate limit: 1,000/sec sustained, 5,000/sec burst; excess returns 429.
- Payloads ≤100KB stored inline on the event row; larger payloads go to Convex file storage.

---

## Security and Privacy

- TLS 1.2+ for all traffic (Convex managed).
- Signing secrets encrypted at rest (AES-256) before storing on the `sources` row.
- Auth and password hashing delegated to Clerk.
- Webhook payloads may contain PII. Treat as confidential. Respect plan retention windows (7/30/60/90/365 days) via Convex crons.
- No production access from local machines. Secrets only via Convex environment variables, never in code.
- See SPEC §6.2–6.3 for full requirements.

---

## Engineering Conventions

User-level preferences apply: direct, structured, precise. No filler, no emojis, no em dashes.

### Code

- TypeScript by default. Explicit typing on public APIs.
- Functional React components, hooks, composable patterns. Bulletproof-React-style organization where applicable.
- Clean separation of concerns; explicit schemas at boundaries.
- No magic values, no implicit behavior, no premature abstraction.
- Default to writing no comments unless the WHY is non-obvious.

### Convex Conventions

- **Ingress**: HTTP Action reads raw body via `request.bytes()`, calls an internal mutation to persist, then returns 2xx. Body bytes are preserved verbatim for re-forwarding — never re-serialize JSON.
- **Retries**: use `ctx.scheduler.runAfter(delayMs, internal.delivery.attempt, ...)` with the SPEC backoff schedule. Never poll for due work.
- **Outbound delivery concurrency**: use the Convex Workpool component to bound in-flight fetches per source.
- **Per-source rate limiting**: Convex Rate Limiter component, or a mutation-managed token bucket if simpler.
- **Large payloads**: inline on the event row if ≤100KB; otherwise upload to Convex file storage and store the storage ID on the event row.
- **Real-time dashboard**: use Convex reactive queries. Do not build SSE or WebSocket layers.
- **Crons**: retention cleanup, monthly usage rollups, and dead-letter sweeps go in `packages/convex/crons.ts`.

### Process

- Do not add features, error handling, or abstractions beyond what the task requires.
- Reversible, small steps. Document assumptions explicitly.
- For risky or shared-state actions (force push, schema migrations that drop data, sending customer-visible traffic), confirm before acting.

---

## Accepted Deviations from SPEC.md

Deliberate departures from the spec. If a future SPEC revision should reflect these, note it in SPEC §16 (Decision Log).

1. **Ingress mechanism (SPEC §7.1, §7.4)**: SPEC specifies Cloudflare Workers for ingress in front of Convex. The current implementation uses Convex HTTP Actions in `packages/convex/http.ts` for the existing Clerk and Stripe webhook routes; the `POST /in/{workspace_slug}/{source_id}` ingress route will land in the same place initially. If global edge p95 < 200ms becomes a real requirement, add the thin Cloudflare Worker in front per SPEC.
2. **Ingress latency (NFR-REL-3)**: Linked to the above. SPEC says p95 < 200ms globally. Convex HTTP Actions execute in a single region. Pick the Convex region nearest the dominant webhook source (us-east for Stripe) and treat the target as p95 < 200ms from that region until the Workers ingress lands.
3. **Frontend (§7.4)**: SPEC says Next.js on Vercel. Repo uses Vite + React. Dashboard does not need SSR. Hosting target is a static SPA host (Cloudflare Pages or Vercel static).

---

## Out of Scope for v1

Reject scope creep into:

- Outbound webhook fan-out (Svix's market).
- Generic durable workflows (Inngest/Trigger.dev).
- Custom transformation/filtering/routing rules.
- Multi-region active-active.
- SOC 2, HIPAA.
- Public REST API.
- RBAC beyond single-owner workspaces.

See SPEC §2.2 and §14 for the full non-goals list and v2 roadmap.

---

## Pointers

- Spec: `.claude/SPEC.md`.
- **Partially superseded by this file**: SPEC §7.1 / §7.4 ingress row (SPEC says Cloudflare Workers; current impl uses Convex HTTP Actions) and SPEC §7.4 dashboard row (SPEC says Next.js on Vercel; repo uses Vite + React). All other §7 layers (database, file storage, scheduler, delivery action) are now consistent between SPEC and this file as of 2026-05-27.
- **Still authoritative in SPEC**: §4 (functional requirements), §5 (pricing), §6 (non-functional, with the NFR-REL-3 deviation noted above), §7.2 (component responsibilities), §7.3 (provider adapter), §8 (data model), §10 (onboarding flow), §11 (risks), §12 (runbook), §13 (open questions), §16 (decision log).
- Decision log: SPEC §16.
- Open questions: SPEC §13. Resolve with the user before encoding assumptions in code.
