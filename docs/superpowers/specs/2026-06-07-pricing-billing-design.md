# Pricing & Billing — Design Spec

**Date:** 2026-06-07
**Status:** Approved (design); pending implementation plan
**Scope:** SPEC §4.7 (FR-BILL-*), §5 (Pricing and Plans), §6.3 (retention), plus admin-controlled pricing catalog.

---

## 1. Purpose

Close every gap between the current billing scaffolding and SPEC §4.7 / §5, and make the pricing catalog fully controllable from the admin app (`apps/admin`) rather than from an env-seeded script.

The current scaffolding provides: `plans`/`subscriptions`/`payments`/`stripeCustomers` tables, Stripe checkout + portal actions, a Stripe webhook that syncs the `subscriptions` table, `usageCounters` incremented at ingress, quota alerts at 80/100/110%, and customer-facing Usage/Pricing/Billing pages.

It does **not** implement: plan resolution onto the workspace, quota enforcement, source-count limits, retention, overage billing, annual plans, or any admin control of the catalog. This spec specifies all of those as eight bounded units plus one admin unit.

---

## 2. Locked decisions

| Decision | Resolution |
|---|---|
| Over-cap behavior, overage off | Persist event, set status `quota_blocked`, do not deliver, still return 2xx. No data loss; provider endpoint stays healthy. |
| Overage billing | Real Stripe metered billing (Stripe Billing Meter + metered Price + delta-reporting cron). |
| Per-tier limit source of truth | The `plans` table (catalog), with limits denormalized onto `workspaces` for the ingress hot path. |
| Pricing control | Admin-managed via `apps/admin`. `createPlan` provisions the Stripe Product + Price(s) through a Convex action and stores the returned IDs. |

---

## 3. Invariants

- **Durability (FR-IN-4):** once a 2xx is returned to the provider the event is persisted. Quota enforcement never returns a non-2xx and never drops a received event; it only withholds delivery.
- **Hot path stays read-light:** the ingress mutation reads only the workspace row for limits. Limits are denormalized onto the workspace; no `plans` lookup per event.
- **Stripe is authoritative for money:** the amount actually charged is whatever the Stripe Price says. The `plans` row mirrors it. `workspace.overageEnabled` is set by the webhook from the live subscription, never inferred client-side.
- **Plan resolution is single-valued:** v1 is one workspace per user, so a subscription maps unambiguously to one workspace via `workspaces.by_owner`.
- **Stripe Prices are immutable:** an amount change creates a new Price and archives the old; existing subscribers keep their Price until re-checkout.

---

## 4. Data model changes

### 4.1 `plans` (extend `stripe-payments/schema.ts`)
Add:
- `tier: union('free','indie','startup','growth','pro')`
- `eventQuota: number`
- `sourceLimit: number` (`-1` = unlimited)
- `retentionDays: number`
- `overageCentsPer1000: optional(number)` (absent = no overage; Free/Pro)
- `overageStripePriceId: optional(string)` (metered Price)
- `stripeProductId: optional(string)`
- New index `byTier` on `['tier']`.

`interval` (`month|year|one-time`) already exists and carries the annual variant. Monthly and annual rows of the same tier duplicate the limit fields; `createPlan`/`updatePlan` keep them consistent. `isActive` already exists and gates visibility on the customer Pricing page.

### 4.2 `workspaces` (extend `workspaces/schema.ts`)
Add (all optional, free-default fallback via `effectiveLimits`):
- `eventQuota: optional(number)`
- `sourceLimit: optional(number)`
- `retentionDays: optional(number)`
- `overageEnabled: optional(boolean)`
- `subscriptionStatus: optional(string)`
- `currentPeriodEnd: optional(number)`
- New index `by_plan` on `['plan']` (limit-refresh fan-out and retention iteration).

### 4.3 `events` (extend `ingress/schema.ts`)
- Add `quota_blocked` to the `status` union.

### 4.4 `usageCounters` (extend `ingress/schema.ts`)
- Add `reportedOverageUnits: optional(number)` (units already reported to Stripe this period; enables idempotent delta reporting).

### 4.5 `lib/plans.ts`
- `PLAN_LIMITS` remains the canonical **free-tier defaults** and dev seed values.
- New `effectiveLimits(workspace)` returns the denormalized workspace limits, falling back to free defaults when absent.
- `billingPeriodUTC`, `QUOTA_THRESHOLDS` unchanged.

### 4.6 Migration posture
All new fields are optional. A `backfillWorkspacePlans` internal mutation backfills existing workspaces with free defaults. No destructive migration.

---

## 5. Units

### Unit 1 — Tier catalog
`plans` table as the catalog source of truth (fields in §4.1). The env-seeded `seedPlans` script is demoted to an optional **dev-only** bootstrap that inserts catalog rows with `isActive=false` and no Stripe IDs. Production pricing is admin-managed (Unit 9).

### Unit 2 — Plan resolution (subscription → workspace)
Closes the core correctness bug: the webhook updates `subscriptions` but never `workspaces.plan`, so `planLimit` always reads `free`.

- New internal mutation `applyPlanToWorkspace({ userId, tier, status, currentPeriodEnd, overageEnabled })`: resolves tier→limits from `plans.byTier`, finds the owner's workspace via `workspaces.by_owner`, patches `plan` + denormalized limits + `subscriptionStatus` + `currentPeriodEnd` + `overageEnabled`.
- `stripe/webhooks.ts` calls it after `upsertSubscription`:
  - `active`/`trialing` → set the tier from the Price.
  - `canceled`/`past_due`/`unpaid` → revert to free defaults.
  - `cancelAtPeriodEnd` while still `active` → keep the tier until period end.
- Price→tier resolution: look up the `plans` row by `stripePriceId` (existing `byStripePriceId` index), read its `tier`. `overageEnabled` is derived from whether the subscription carries the tier's `overageStripePriceId` item.

### Unit 3 — Quota enforcement (persist-and-block)
In `persistEvent`, after the usage increment:
- `quota = effectiveLimits(workspace).eventQuota`.
- `newCount <= quota` → unchanged (`received`, scheduled).
- Over quota and `overageEnabled` → deliver normally (overage accounted by Unit 5 from the counter; no per-event flag).
- Over quota, not enabled, signature-valid → status `quota_blocked`, no delivery scheduled, still return 2xx.
- Invalid-signature events keep current behavior (stored, never delivered) regardless of quota.

`persistEvent` returns the quota decision; `ingestFromHttp` applies status + scheduling. `quota_blocked` events are replayable; replay re-checks quota/overage.

### Unit 4 — Source-count limits
Enforce in `insertSource` (the transactional mutation, not just the action): count active (non-`deletedAt`) sources via `by_workspace`, compare to `effectiveLimits.sourceLimit` (`-1` = unlimited), throw a clear error when exceeded.

### Unit 5 — Overage metering (Stripe)
- `setOverageEnabled(enabled)` action: adds/removes the tier's `overageStripePriceId` metered item on the live Stripe subscription. The webhook (subscription.updated → Unit 2) sets the authoritative `workspace.overageEnabled`.
- Reporting cron (hourly): for each workspace with `overageEnabled` and `eventCount > quota` in the current period, compute `overageUnits = ceil((eventCount - quota) / 1000)`, report the delta vs `reportedOverageUnits` to the shared Stripe Billing Meter keyed by `stripeCustomerId`, then patch `reportedOverageUnits`. Delta-based + persisted cursor makes it idempotent and crash-safe.
- Free/Pro have no `overageStripePriceId`; the toggle is disabled for them.

### Unit 6 — Retention crons (`crons.ts`, new)
Daily `purgeExpiredEvents`: per workspace, cutoff = `now - retentionDays * day`; delete events with `receivedAt < cutoff` plus their `deliveryAttempts` and `rawBodyStorageId` blobs, paginated to respect Convex limits, scanning via `by_workspace_received`.
- **Exemption:** `deadLetter` events are kept until `deadLetterAt + 30d` (FR-OUT-9) even when the plan window is shorter.
- Same file gets the related sweeps: soft-deleted sources purged after 30 days (FR-SRC-6); canceled-workspace data purged after 60 days (FR-BILL-7).

### Unit 7 — Annual plans
Seed monthly + annual `plans` rows per paid tier; annual `priceCents = monthly * 10` (2 months free), `interval='year'`, same tier + limits. Resolution maps either Price to the same tier. Backend is catalog-only; the customer Billing/Pricing UI gets a monthly/annual toggle.

### Unit 8 — Customer dashboard / UI (`apps/web`)
- Pricing page: render tiers from `listPlans`, monthly/annual toggle, show quota / source limit / retention in the feature list.
- Billing page: current plan + subscription status, overage toggle (`setOverageEnabled`), portal link.
- Usage page: event count vs quota, source count vs limit, and (overage on) overage units + projected cost.
- Event list/detail: render `quota_blocked`; replay re-checks quota.

### Unit 9 — Admin plan management (`apps/admin`)
Mirrors the blog-dashboard pattern: `requireRole(ctx, 'admin')` backend, `AdminGate` + `AdminLayout` + sidebar route, `useQuery`/`useMutation`.

**Backend** (admin-gated; Stripe calls in a `'use node'` action):
- `adminListPlans` (query): all plans including inactive/archived.
- `createPlan` (action): creates a Stripe Product + Price (amount, currency, interval) and, when `overageCentsPer1000` is set, a metered Price bound to the shared Billing Meter; inserts the `plans` row with `stripeProductId`, `stripePriceId`, `overageStripePriceId`, tier, and limits.
- `updatePlan` (mutation): edits non-price fields (`name`, `description`, `features`, `tier`, `eventQuota`, `sourceLimit`, `retentionDays`, `isActive`); no Stripe call; schedules `refreshWorkspacesForTier`.
- `changePlanPrice` (action): amount change creates a new Stripe Price, archives the old one, updates `stripePriceId` + `priceCents`; schedules `refreshWorkspacesForTier`. Existing subscribers keep their Price until re-checkout (surfaced in UI).
- `archivePlan` (mutation/action): `isActive=false` (hides from customer Pricing) and archive the Stripe Price.
- `refreshWorkspacesForTier(tier)` (internal mutation): re-patch denormalized `eventQuota`/`sourceLimit`/`retentionDays` onto every workspace on that tier via `by_plan`.
- Shared Billing Meter (`eventsnare_overage_events`) created once via a bootstrap action if absent.

**Frontend** (`apps/admin/src/features/plans-dashboard`): `PlansIndex` (table like `BlogIndex`) and `PlanEditor` (form: tier, name, amount, currency, interval, eventQuota, sourceLimit, retentionDays, overage cents/1000, features, isActive). Add `/plans`, `/plans/new`, `/plans/:planId` routes in `App.tsx` and a `Plans` item in `AdminSidebar`.

---

## 6. Failure modes and edge cases

- **Webhook arrives before user row synced from Clerk:** `applyPlanToWorkspace` no-ops gracefully if the workspace is not found; resolution re-applies on the next subscription event.
- **Downgrade below current usage:** workspace may already be over the new (lower) quota; subsequent events go `quota_blocked` (overage off) — no retroactive blocking of already-delivered events.
- **Downgrade below current source count:** existing sources are kept; `insertSource` blocks new ones until under the limit.
- **Retention vs dead-letter:** dead-letter replay window (30d) wins over a shorter plan window.
- **Overage cron crash mid-report:** delta cursor (`reportedOverageUnits`) is patched only after a successful report; a crash re-reports the same delta, which the meter dedups by being additive on the next successful run (cursor ensures no double count).
- **Admin edits limits for a tier with live subscribers:** `refreshWorkspacesForTier` propagates; until it runs, workspaces hold the prior denormalized limits.
- **Plan resolution for an unknown Price:** if no `plans` row matches the `stripePriceId`, treat as free (fail safe) and log.

---

## 7. Testing

**Unit:**
- Price→tier resolution; downgrade-on-cancel reverts to free defaults.
- `effectiveLimits` fallback when workspace fields absent.
- Quota decision: under / at / over cap, overage on vs off.
- Source-limit check incl. `-1` unlimited.
- Retention cutoff selection incl. dead-letter exemption.
- Overage delta computation idempotency across repeated cron runs.

**Flow:**
- Webhook (created/updated/deleted) → workspace plan + limits + status patched correctly.
- Ingress over-cap, overage off → `quota_blocked`, no delivery scheduled, 2xx returned.
- Ingress over-cap, overage on → delivered + counted; cron reports correct delta.
- `createPlan` → Stripe Product/Price created, row stores returned IDs.
- `changePlanPrice` → new Price created, old archived, row updated, workspaces refreshed.

---

## 8. Assumptions

1. Overage defaults off (FR-BILL-4 hard-cap default).
2. `quota_blocked` events are replayable; replay re-checks quota.
3. Dead-letter events exempt from retention purge until `deadLetterAt + 30d`.
4. Limits denormalized onto `workspace` for the hot path; `plans` is the catalog source, copied at resolution and on admin edits.
5. New `workspace`/`plans`/`usageCounters` fields are optional with free-default fallback; `backfillWorkspacePlans` handles existing rows.
6. v1 single-workspace-per-user makes subscription→workspace unambiguous.
7. Stripe Prices are immutable; admin amount edits create-new + archive-old; existing subscribers keep their Price until re-checkout.
8. A single shared Stripe Billing Meter backs all tier overage prices; created once via bootstrap.
9. `seedPlans` is dev-only bootstrap; production pricing is admin-managed via Unit 9.

---

## 9. Out of scope

- Proration UX beyond Stripe defaults.
- Multi-currency display (single currency per plan row in v1).
- Coupon/discount management UI (Stripe dashboard handles promos in v1).
- Per-source quotas (workspace-level only).
