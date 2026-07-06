# Eventsnare Ubiquitous Language

Source of truth for terminology used by human developers and AI agents on this codebase. Derived from the Convex schema (`packages/backend/convex/*/schema.ts`), the query/mutation/action surface, the public HTTP routes (`http.ts`, `ingressHttp.ts`), and the Clerk/Stripe webhook handlers. When a term here conflicts with code, fix the code or update this file — do not let both drift.

Terminology rules:
- Names in `CodeFont` are the exact table, field, function, or literal as they appear in the codebase. Use them verbatim.
- "Aliases to avoid" are banned synonyms. Do not introduce them in code, comments, UI copy, or docs.
- `[NEEDS CLARIFICATION]` marks a term whose definition is genuinely ambiguous in the current code and must be resolved with the team.

---

## 1. Core Entities

### Primary entities

#### Source
- **Definition:** A single third-party webhook configuration owned by a workspace — one provider, one destination `forwardUrl`, and one encrypted signing secret — against which inbound events are received and verified.
- **Database representation:** `sources` table. Key fields: `workspaceId`, `provider` (string, e.g. `stripe`, `github`), `name`, `forwardUrl`, `signingSecretEncrypted` (AES-256-GCM, base64 `iv||ciphertext`), `status` (string), `maxRetries` (1–7), `deletedAt` (soft delete), plus outbound-security fields `forwardHeaders`, `forwardHeaderKeys`, `outboundSigningSecretEncrypted`. Indexed `by_workspace`.
- **Aliases to avoid:** Endpoint, Integration, Connection, Hook, HookConfig, Channel, Feed. (In this system "endpoint" refers only to the customer's `forwardUrl` target, never to the Source itself.)

#### Event
- **Definition:** The durable record of one inbound webhook received at the ingress URL, verified, and deduplicated — the unit that Eventsnare stores and reliably delivers.
- **Database representation:** `events` table. Key fields: `sourceId`, `workspaceId`, `providerEventId`, `eventType`, `signatureValid` (bool), body as `rawBodyInline` (≤100KB) or `rawBodyStorageId` (File Storage), `status` (see §3), `attemptCount`, `nextAttemptAt`, `deadLetterAt`, and denormalized `lastStatusCode` / `lastErrorMessage`. Dedup index `by_dedup_key` on `(sourceId, providerEventId)` — **first write wins**.
- **Aliases to avoid:** Webhook (an inbound *webhook* HTTP call becomes an *Event*; the two are not interchangeable — see §4), Message, Payload (the payload is a field of the Event, not the Event), Request, Notification (a distinct entity — see below), Hook.

#### DeliveryAttempt
- **Definition:** One forwarding attempt of an event to its source's `forwardUrl`, recording the outcome of that single HTTP call.
- **Database representation:** `deliveryAttempts` table. Fields: `eventId`, `attemptNumber` (1-based), `startedAt`, `completedAt`, `statusCode`, `responseBodyTruncated`, `errorMessage`. Indexed `by_event`.
- **Aliases to avoid:** Retry (a retry is the *scheduling* of the next attempt, not the attempt record), Delivery (ambiguous — reserve "delivery" for the act; the record is a DeliveryAttempt), Try, Send.

#### Workspace
- **Definition:** The tenant boundary in v1 — exactly one per user at signup, owned by a single user, to which all sources, events, and usage counters belong.
- **Database representation:** `workspaces` table. Fields: `ownerUserId`, `slug` (unique public path segment in the ingress URL), `name`, `plan` (string), `allowOverages` (optional bool). Indexed `by_owner`, `by_slug`.
- **Aliases to avoid:** Tenant, Organization, Org, Team, Account (Account belongs to the Clerk boundary — see §4), Project.

#### User
- **Definition:** A person authenticated through Clerk, mirrored locally as the owner of a workspace and the actor behind dashboard operations.
- **Database representation:** `users` table. Fields: `clerkId` (the Clerk identity subject), `email`, `name`, `imageUrl`, `phoneHash` (HMAC of verified phone, set by the Clerk webhook). Indexed `byClerkId`.
- **Aliases to avoid:** Account, Member, Customer (Customer is a billing/Stripe concept — see `stripeCustomers`), Person, Profile (a `userProfiles` row is the User's Profile, not the User).

### Supporting entities

| Entity | Table | Definition | Aliases to avoid |
|---|---|---|---|
| Provider | (no table; `sources.provider` string + `providers/{name}.ts` adapters) | A supported third-party webhook source system (Stripe, GitHub, Shopify, Clerk, Resend) with a signature-verification adapter. | Integration, Vendor, Service, Connector |
| UsageCounter | `usageCounters` | Per-workspace, per-billing-period count of ingested events for quota/billing. | Quota, Meter, Tally |
| DeliveryStatsHourly | `deliveryStatsHourly` | Per-source hourly rollup of attempts/outcomes/latency for observability. | Metrics, Analytics (Analytics is the read model/query, not this table) |
| Alert | `alerts` | Per-workspace channel configuration for a failure/dead-letter/quota alert type. | Notification, Warning |
| AlertState | `alertState` | Idempotency/anti-spam ledger so a given alert fires at most once. | AlertLog, AlertHistory |
| Notification | `notifications` | An in-app inbox item shown to a user in the dashboard. | Alert (Alert is the outbound email/Slack config; Notification is the in-app inbox), Message, Toast |
| PushSubscription | `pushSubscriptions` | A registered Web Push endpoint for a user's browser. | Device, Subscription (Subscription is billing — see below) |
| PhoneLedger | `phoneLedger` | Abuse ledger keyed by phone hash, gating one free tier per verified phone across re-signups. | AbuseLog, PhoneRecord |
| Role / UserRole | `roles` / `userRoles` | An RBAC role (`admin`, `member`, `viewer`) and its assignment to a user. | Permission (a Role *has* permissions), Group |
| BlogPost | `blogPosts` | A marketing blog article authored by a user, rendered on the landing site. | Article, Post (informal), Page |
| Plan | `plans` | A purchasable Stripe pricing tier (price, interval, features). | Tier (informal), Package, Product |
| Subscription | `subscriptions` | A user's active Stripe subscription to a plan. | Membership, PushSubscription (unrelated), Plan |
| Payment | `payments` | A recorded Stripe payment intent outcome for a user. | Charge, Transaction, Invoice |
| StripeCustomer | `stripeCustomers` | The mapping from a local user to their Stripe customer id. | Customer (unqualified — always "StripeCustomer" at this boundary) |
| CliToken | `cliTokens` | A long-lived hashed device token authenticating the `eventsnare listen` CLI. | ApiKey, AccessToken, Secret |
| CliSession | `cliSessions` | A CLI listen session bound to one source, draining webhooks to localhost. | Connection, Stream, Tunnel |
| LocalDelivery | `localDeliveries` | A queued forward of one event to a CLI session's localhost target. | Forward, Relay, Delivery (reserve for prod DeliveryAttempt) |
| UserProfile | `userProfiles` | Optional public profile fields (bio, location, avatar) for a user. | Account, Settings |
| UserSetting | `userSettings` | A single key/value preference for a user. | Preference (informal ok in UI), Config |
| ActivityLog | `activityLogs` | Write-only security audit record of a sensitive operation. | AuditLog (acceptable synonym), History, Event (**never** — collides with the core Event) |
| RateLimit | `rateLimits` | A fixed-window counter row backing per-key rate limiting. | Throttle, Quota (Quota is usage/billing) |

---

## 2. Core Actions & Workflows

Convex functions are named by their exported symbol and module, e.g. `ingress.ingestEvent`. "Internal" = `internalMutation`/`internalAction`/`internalQuery`, not callable from the client.

### Ingress and delivery (the core pipeline)

#### Ingest
- **Definition:** Receive an inbound webhook, verify its provider signature, deduplicate on `(sourceId, providerEventId)` (first write wins), durably persist the Event, increment the usage counter, then schedule delivery. Resulting state: a persisted Event in `received` status with delivery scheduled.
- **Trigger:** Public HTTP Action `ingress` at `POST /in/{workspaceSlug}/{sourceId}` (route `pathPrefix: '/in/'`). Calls internal `ingress.ingestFromHttp`. (`ingress.ingestEvent` is a client-callable mutation variant used for simulated/test ingest.)
- **Invariant:** Once a 2xx is returned to the provider, the Event is already persisted (persist-before-ack).

#### Attempt (Deliver)
- **Definition:** Forward an event's exact raw body to the source's `forwardUrl` with a 30s timeout, record a DeliveryAttempt, and either mark the Event `delivered` or reschedule the next attempt per the backoff schedule.
- **Trigger:** Internal action `delivery.attempt`, scheduled via `ctx.scheduler.runAfter` (initial `runAfter(0)` from ingest; re-scheduled by itself on failure). Never polled.
- **Backoff schedule (`BACKOFF_MS`):** 10s, 30s, 2m, 10m, 1h, 6h, 24h. Dead-letter when `attemptNumber >= source.maxRetries` (configurable 1–7, default 7).

#### Replay
- **Definition:** Re-enqueue delivery for an existing Event (typically after a `deadLetter` or `failed`), producing new DeliveryAttempts without re-receiving the webhook.
- **Trigger:** Client mutation `events.replay` (single) / `events.replayBulk` (many) from the dashboard replay button. CLI equivalent: `cliDelivery.replayEvent`.

#### RecordAttemptResult
- **Definition:** Persist the outcome of one attempt: write the DeliveryAttempt, update `deliveryStatsHourly`, denormalize `lastStatusCode`/`lastErrorMessage`, and transition the Event (`delivered`, reschedule, or `deadLetter` + owner notification).
- **Trigger:** Internal mutation `delivery.recordAttemptResult`, called by `delivery.attempt`.

### Source management

| Action | Function | Trigger |
|---|---|---|
| Create Source | `sources.create` (action; encrypts secret, then `insertSource`) | Dashboard "New Source" |
| Update Source | `sources.update` → `patchSource` | Dashboard edit |
| Rotate Signing Secret | `sources.rotateSecret` | Dashboard button |
| Rotate Outbound Secret | `sources.rotateOutboundSecret` | Dashboard button |
| Reveal Outbound Secret | `sources.revealOutboundSecret` → `claimOutboundSecretReveal` (audited) | Dashboard button |
| Send Test Event | `sources.sendTestEvent` | Dashboard button (produces an Event with `isTest: true`) |

### Auth and provisioning

| Action | Function | Trigger |
|---|---|---|
| Sync User | `auth/users.syncUser` (internal) | Clerk webhook `user.created` / `user.updated` |
| Delete User | `auth/users.deleteUser` (internal) | Clerk webhook `user.deleted` |
| Ensure Workspace | `workspaces.ensureForCurrentUser` | First authenticated dashboard load / onboarding |
| Get My Roles | `rbac.getMyRoles` | Dashboard auth gate |
| Set/Unset User Role | `admin.setUserRole` / `admin.unsetUserRole` | Admin app |

### Billing (Stripe)

| Action | Function | Trigger |
|---|---|---|
| Create Checkout Session | `stripeActions.createCheckoutSession` | Pricing/upgrade UI |
| Create Portal Session | `stripeActions.createPortalSession` | Billing UI |
| Upsert Subscription | `stripe.upsertSubscription` (internal) | Stripe webhook |
| Record Payment | `stripe.recordPayment` (internal) | Stripe webhook |

### CLI (local forwarding)

| Action | Function | Trigger |
|---|---|---|
| Issue Token | `cliTokens.issueToken` (raw shown once) | Dashboard CLI page |
| Revoke Token | `cliTokens.revokeToken` | Dashboard CLI page |
| Register Session | `cliSessions.registerSession` | `eventsnare listen` startup |
| Heartbeat / End Session | `cliSessions.heartbeat` / `endSession` | CLI lifecycle |
| Claim / Ack Local Delivery | `cliDelivery.claimDelivery` / `ackDelivery` | CLI drain loop |

### Alerts and background sweeps

- **Dispatch Alert:** `alerts/dispatch.dispatchAlert` (internal action), fired on dead-letter, quota threshold, or failure burst; deduped via `alertState`.
- **Crons (`crons.ts`):** `sweepDeliveryStats`, `sweepRateLimits`, `sweepLocalDeliveries`, `sweepStaleSessions`. [NEEDS CLARIFICATION] retention cleanup and monthly usage rollup are named in CLAUDE.md as cron responsibilities but no matching sweep is present in `crons.ts` yet — confirm they exist or are pending.

---

## 3. States & Statuses

### Event lifecycle (`events.status`)
Literal union in schema: `received | delivering | delivered | failed | deadLetter`.

| State | Entry criteria |
|---|---|
| `received` | Event persisted after signature verification and dedup; delivery scheduled but not yet attempted. |
| `delivering` | A `delivery.attempt` is in flight (HTTP call to `forwardUrl` open). |
| `delivered` | An attempt returned a 2xx. Terminal (until a manual Replay). |
| `failed` | An attempt failed (non-2xx or transport error) and a further retry is scheduled per backoff. Not terminal. |
| `deadLetter` | `attemptNumber >= source.maxRetries` reached without success. Terminal until Replay; triggers a dead-letter alert + owner notification. |

Notes:
- The code literal is `deadLetter` (camelCase). Prose/UI term is "dead-letter". Do not write `dead_letter` or `deadletter` in code.
- `signatureValid` is a separate boolean on the Event, not a status — an event with `signatureValid: false` is still persisted.
- [NEEDS CLARIFICATION] SPEC §8 lists a `queued` status that the code does not implement. Either add `queued` between `received` and `delivering` or amend SPEC — currently `received` covers the queued window.

### Other status enums
| Entity | Field | Values | Notes |
|---|---|---|---|
| BlogPost | `status` | `draft | published` | `published` also sets `publishedAt`. |
| CliSession | `status` | `active | ended` | `ended` sets `endedAt`. |
| LocalDelivery | `status` | `pending | claimed | done | failed | expired` | CLI drain lifecycle. |
| Source | `status` | `v.string()` — **not an enum** | [NEEDS CLARIFICATION] enumerate the real values (likely `active` / `paused`; deletion is via `deletedAt`, not a status). Should be a literal union. |
| Subscription | `status` | `v.string()` (Stripe-derived) | [NEEDS CLARIFICATION] pin the accepted Stripe statuses (`active`, `trialing`, `past_due`, `canceled`, ...) and whether we normalize them. |
| Payment | `status` | `v.string()` (Stripe-derived) | [NEEDS CLARIFICATION] same as above. |
| Workspace | `plan` | `v.string()` | [NEEDS CLARIFICATION] enumerate plan slugs; align with `plans` / SPEC §5 pricing tiers. |

---

## 4. External Boundaries

### Clerk (identity)
- **Clerk User vs (Eventsnare) User:** Clerk owns identity and credentials. The `users` table is a local **mirror**, keyed by `clerkId` (= the JWT `subject`), synced by the Clerk webhook (`user.created/updated/deleted`). "User" unqualified means the Eventsnare `users` row; say "Clerk user" for the upstream identity.
- **Account:** Do not use "Account" for either side. Clerk's own docs say "user"; our domain says "User" or "Workspace". "Account" is banned to avoid conflating identity, tenant, and billing.
- **Session / JWT:** Auth is via `ConvexProviderWithClerk`; Convex trusts the issuer configured in `CLERK_JWT_ISSUER_DOMAIN` (`auth.config.ts`). `ctx.auth.getUserIdentity().subject` == `users.clerkId`.
- **Clerk webhook vs Event:** The Clerk webhook at `POST /clerk-webhook` is a **system-internal** identity sync. It is NOT a customer Event and never lands in the `events` table. Same for the Stripe webhook (`POST /stripe-webhook`). Only customer-provider webhooks arriving at `POST /in/{workspaceSlug}/{sourceId}` become Events.

### Stripe (billing)
- **StripeCustomer / Subscription / Payment / Plan** live at the Stripe boundary (§1 supporting entities). Always qualify "Customer" as "StripeCustomer" — an unqualified "Customer" is banned because it collides with User and with the informal notion of a paying account.
- **Stripe webhook** (`POST /stripe-webhook`) drives `upsertSubscription` and `recordPayment`. System-internal, not an Event.

### Provider (the ingress boundary)
- **Provider** is the third-party system whose webhooks a Source receives (`stripe`, `github`, `shopify`, `clerk`, `resend`), each with a signature adapter in `providers/{name}.ts`.
- [NEEDS CLARIFICATION] **Naming collision:** Clerk is simultaneously our auth **identity provider** and a supported webhook **Provider** (a customer can point a Clerk webhook at a Source). And "Stripe" is both our billing boundary and a supported Provider. When ambiguous, write "auth Provider (Clerk)" vs "webhook Provider (Clerk)". Confirm the preferred disambiguation.

### Ingress URL vs Forward URL
- **Ingress URL:** the Eventsnare receive address, `https://<host>/in/{workspaceSlug}/{sourceId}`. The customer configures this at the provider. Do not call it "webhook URL" (ambiguous with the forward target).
- **Forward URL (`forwardUrl`):** the customer's own endpoint that Eventsnare delivers to. This is the only thing called "endpoint" in this system.
- **Forwarded-request headers:** every forwarded request carries `X-Eventsnare-Event-Id`, `X-Eventsnare-Attempt`, `X-Eventsnare-Source`, `X-Eventsnare-Original-Signature` (and, when outbound signing is enabled, `X-Eventsnare-Signature`).

---

## Open items to resolve (`[NEEDS CLARIFICATION]` summary)
1. `sources.status`, `subscriptions.status`, `payments.status`, `workspaces.plan` are free `v.string()` fields — enumerate and convert to literal unions.
2. SPEC §8 `queued` event status is absent from the code union — reconcile.
3. Retention-cleanup and monthly usage-rollup crons named in CLAUDE.md are not present in `crons.ts` — confirm status.
4. Provider naming collision for Clerk and Stripe (auth/billing boundary vs supported webhook Provider) — pick the disambiguation convention.
5. Is "Customer" ever an official domain term, or always "User" (dashboard) / "StripeCustomer" (billing)?
