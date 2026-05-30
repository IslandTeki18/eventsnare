# Convex Ingress Stress Test

Validates that Convex sustains Hookline/Eventsnare's write-heavy ingress workload before the
production ingress path is built. It exercises the exact transactional hot path the real edge
worker will drive and measures it against the SPEC non-functional requirements.

## What it measures

- **Ingress mutation latency** (`api.ingress.ingestEvent`), client-side, as p50/p95/p99.
- **Sustained ingress throughput** versus the target rate.
- **Scheduler drain**: after ingress stops, what fraction of scheduled `simulatedDelivery`
  actions completed (proving the Convex scheduler keeps up with the ingress rate).

The hot path per call, in one transaction:

1. Dedup on `(sourceId, providerEventId)` via the `by_dedup_key` index.
2. Load source.
3. Insert the `events` row (`status: received`, `attemptCount: 0`).
4. Atomically increment the monthly `usageCounters` row.
5. Schedule `internal.ingress.simulatedDelivery` immediately if signature is valid.

## What it explicitly does NOT measure

- **No edge-worker / Cloudflare layer.** The runner calls Convex directly over HTTP, standing
  in for the eventual edge worker. There is no ingress proxy in front.
- **No signature verification.** Every event is fired with `signatureValid: true`.
- **No real outbound HTTP delivery.** `simulatedDelivery` sleeps 50ms instead of making a real
  request. This isolates scheduler throughput from third-party endpoint latency.

## Setup

From the repo root:

```bash
pnpm add -D tsx convex     # already added to root package.json; this installs them
pnpm install
```

Push the schema and start a deployment to get the `CONVEX_URL`:

```bash
pnpm --filter @eventsnare/convex dev
# or: cd packages/backend/convex && npx convex dev
```

Confirm the schema pushes with no validator/index errors. The deployment URL printed by
`convex dev` (e.g. `https://<name>.convex.cloud`) is your `CONVEX_URL`.

## Recommended runs (in order)

Run these against a dev deployment from the region nearest the deployment for representative
latency (see triage notes below).

| Run | Command | Purpose |
|---|---|---|
| 1. Smoke | `CONVEX_URL=<url> STRESS_RATE=10 STRESS_DURATION_SECONDS=30 pnpm tsx scripts/stress-test.ts` | Verify the harness works end to end (~300 events). |
| 2. Decision point | `CONVEX_URL=<url> STRESS_RATE=100 STRESS_DURATION_SECONDS=300 pnpm tsx scripts/stress-test.ts` | The architecture-commit test (~30k events). |
| 3. Stretch | `CONVEX_URL=<url> STRESS_RATE=300 STRESS_DURATION_SECONDS=60 pnpm tsx scripts/stress-test.ts` | Headroom check (~18k events). |

Environment variables:

| Var | Default | Meaning |
|---|---|---|
| `CONVEX_URL` | (required) | Target deployment URL. Missing -> exit code 2. |
| `STRESS_RATE` | `100` | Target events per second. |
| `STRESS_DURATION_SECONDS` | `300` | Firing duration. |
| `STRESS_SOURCE_COUNT` | `10` | Number of sources to spread load across. |
| `STRESS_LABEL` | auto | Label recorded on the `stressTestRuns` row. |
| `STRESS_KEEP_DATA` | unset | Set to `1` to skip teardown and inspect data afterward. |

## Interpreting results

The runner prints a PASS/FAIL table evaluated against:

- Zero ingress failures.
- p95 < 200ms (SPEC NFR-REL-3).
- p99 < 500ms (SPEC NFR-REL-3).
- Sustained rate >= 95% of target.
- Delivery completion >= 95% within 30s after ingress ends.

Exit codes: `0` all pass, `1` one or more fail, `2` fatal error (e.g. missing `CONVEX_URL`).

Expected behavior by rate:

- **10/sec**: trivially clean. If this fails, the problem is environmental (URL, network,
  schema not pushed), not capacity.
- **100/sec**: should pass cleanly. This is the commit threshold; a clean pass here is the
  primary signal that Convex is the right call.
- **300/sec**: latency p95/p99 should still pass. Sustained rate may dip slightly under
  client-side backpressure; focus on the latency percentiles, not perfect rate adherence.

## Triage

| Symptom | Likely cause | Next step |
|---|---|---|
| High p95 even at 10/sec | Network distance to the deployment, not Convex capacity | Run from a host near the deployment region; compare. |
| Many ingress failures | Convex throttling the client | Lower `STRESS_RATE`; check the Convex dashboard for rate-limit/error logs. |
| Scheduler lag (low delivery completion, many `received`/`delivering` left) | Scheduler can't drain at ingress rate | Batch deliveries (one action handling N events) instead of one action per event. |
| Latency degrades over the run at a fixed rate | Write contention on hot rows (the per-workspace `usageCounters` row) | Shard the counter (e.g. `(workspaceId, billingPeriod, shard)`), aggregate on read. |

## What success looks like

- **100/sec passes cleanly** (zero failures, p95 < 200ms, p99 < 500ms, full delivery drain).
- **300/sec passes p95/p99** latency even if sustained rate dips under backpressure.

Together these confirm Convex sustains the ingress workload with headroom, and the architecture
decision to build the real ingress path on Convex is sound.
