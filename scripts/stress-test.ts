// Hookline/Eventsnare Convex ingress stress-test runner.
//
// Drives api.ingress.ingestEvent against a live Convex deployment at a target rate to
// validate the write-heavy ingress hot path before the real edge worker is built. It
// stands in for the edge worker: it generates synthetic Stripe-shaped payloads, fires
// ingest mutations at a paced rate with client-side backpressure, measures per-call
// latency, then verifies the scheduler drained deliveries. Pass/fail is auto-evaluated
// against the SPEC NFRs (ingress p95 < 200ms, p99 < 500ms; sustained rate; delivery drain).
//
// This does NOT exercise: the edge-worker / Cloudflare layer, signature verification, or
// real outbound HTTP delivery (delivery is simulated with a 50ms sleep server-side).
//
// Run with: CONVEX_URL=<url> pnpm tsx scripts/stress-test.ts

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../packages/backend/convex/_generated/api';

// ---------------------------------------------------------------------------
// Config (env-driven)
// ---------------------------------------------------------------------------

const CONVEX_URL = process.env.CONVEX_URL;
const RATE = Number(process.env.STRESS_RATE ?? 100);
const DURATION_SECONDS = Number(process.env.STRESS_DURATION_SECONDS ?? 300);
const SOURCE_COUNT = Number(process.env.STRESS_SOURCE_COUNT ?? 10);
const PROBE_COUNT = Number(process.env.STRESS_PROBE_COUNT ?? 20);
const KEEP_DATA = process.env.STRESS_KEEP_DATA === '1';

const LABEL =
  process.env.STRESS_LABEL ?? `stress-${RATE}rps-${DURATION_SECONDS}s-${process.pid}`;
const WORKSPACE_ID = `ws-${LABEL}`;

// Backpressure: never let more than this many ingest calls be in flight at once.
const MAX_IN_FLIGHT = 500;
// How long to wait for the scheduler to drain simulated deliveries after ingress ends.
const DRAIN_WAIT_SECONDS = 30;

// Pass/fail thresholds (SPEC NFR-REL-3/4).
const THRESHOLDS = {
  p95Ms: 200,
  p99Ms: 500,
  sustainedRateRatio: 0.95,
  deliveryCompletionRatio: 0.95,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const rank = (p / 100) * (sortedAsc.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (rank - lo);
}

// ~3KB Stripe-shaped event: a charge plus 20 padding metadata fields to hit realistic size.
function buildPayload(seq: number): { body: string; eventType: string } {
  const metadata: Record<string, string> = {};
  for (let i = 0; i < 20; i++) {
    metadata[`field_${i}`] = `value_${seq}_${i}_`.padEnd(120, 'x');
  }
  const payload = {
    id: `evt_${seq}_${WORKSPACE_ID}`,
    object: 'event',
    type: 'charge.succeeded',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    data: {
      object: {
        id: `ch_${seq}`,
        object: 'charge',
        amount: 2000,
        currency: 'usd',
        captured: true,
        paid: true,
        status: 'succeeded',
        description: 'Stress test charge',
        receipt_email: `customer+${seq}@example.test`,
        metadata,
      },
    },
  };
  return { body: JSON.stringify(payload), eventType: payload.type };
}

function fmtMs(ms: number): string {
  return `${ms.toFixed(1)}ms`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  if (!CONVEX_URL) {
    console.error('FATAL: CONVEX_URL is required.');
    return 2;
  }

  const client = new ConvexHttpClient(CONVEX_URL);

  console.log(`[stress] label=${LABEL}`);
  console.log(
    `[stress] rate=${RATE}/s duration=${DURATION_SECONDS}s sources=${SOURCE_COUNT} workspace=${WORKSPACE_ID}`,
  );

  const runId = await client.mutation(api.stressTest.recordRunStart, {
    label: LABEL,
    startedAt: Date.now(),
    targetEventsPerSecond: RATE,
    targetDurationSeconds: DURATION_SECONDS,
  });

  // Provision a real workspace row for this run; sources/events/counters key off its id
  // (workspaceId is now v.id('workspaces'), not a bare string).
  const workspaceId = await client.mutation(api.stressTest.setupWorkspace, {
    label: LABEL,
  });

  const sourceIds = await client.mutation(api.stressTest.setupSources, {
    workspaceId,
    count: SOURCE_COUNT,
  });
  console.log(`[stress] created ${sourceIds.length} sources`);

  // --- Sequential latency probe ------------------------------------------
  // Fire PROBE_COUNT ingest calls strictly one at a time (concurrency 1, no overlap)
  // to measure baseline single-call round-trip latency. This isolates network/client
  // round-trip from the concurrency-and-contention effects the paced loop introduces:
  // if the probe is already slow, the bottleneck is the deployment/network, not load.
  const probeLatencies: number[] = [];
  if (PROBE_COUNT > 0) {
    for (let i = 0; i < PROBE_COUNT; i++) {
      const start = performance.now();
      await client.mutation(api.ingress.ingestEvent, {
        sourceId: sourceIds[i % sourceIds.length],
        providerEventId: `probe_${i}_${WORKSPACE_ID}`,
        eventType: 'charge.succeeded',
        signatureValid: true,
        rawBodyInline: buildPayload(i).body,
      });
      probeLatencies.push(performance.now() - start);
    }
    const ps = [...probeLatencies].sort((a, b) => a - b);
    console.log(
      `[stress] probe (n=${PROBE_COUNT}, concurrency=1): ` +
        `min=${fmtMs(ps[0])} p50=${fmtMs(percentile(ps, 50))} ` +
        `p95=${fmtMs(percentile(ps, 95))} max=${fmtMs(ps[ps.length - 1])}`,
    );
  }

  // --- Firing loop --------------------------------------------------------
  const latencies: number[] = [];
  let attempted = 0;
  let succeeded = 0;
  let failed = 0;
  let inFlight = 0;
  const pending = new Set<Promise<void>>();

  const intervalMs = 1000 / RATE;
  const loopStart = performance.now();
  const loopEnd = loopStart + DURATION_SECONDS * 1000;
  let lastProgress = loopStart;
  let seq = 0;

  function fire(): void {
    const n = seq++;
    const sourceId = sourceIds[n % sourceIds.length];
    const { body, eventType } = buildPayload(n);
    attempted++;
    inFlight++;

    const callStart = performance.now();
    const p = client
      .mutation(api.ingress.ingestEvent, {
        sourceId,
        providerEventId: `evt_${n}_${WORKSPACE_ID}`,
        eventType,
        signatureValid: true,
        rawBodyInline: body,
      })
      .then(() => {
        latencies.push(performance.now() - callStart);
        succeeded++;
      })
      .catch((err) => {
        failed++;
        if (failed <= 10) console.error(`[stress] ingest failed: ${String(err)}`);
      })
      .finally(() => {
        inFlight--;
        pending.delete(p);
      });
    pending.add(p);
  }

  let nextFireAt = loopStart;
  while (performance.now() < loopEnd) {
    const now = performance.now();

    // Backpressure: if too many calls are outstanding, pause and re-evaluate.
    if (inFlight >= MAX_IN_FLIGHT) {
      await sleep(5);
      nextFireAt = performance.now();
      continue;
    }

    if (now >= nextFireAt) {
      fire();
      nextFireAt += intervalMs;
      // If we have fallen behind, do not try to burst-catch-up indefinitely.
      if (nextFireAt < now - intervalMs) nextFireAt = now;
    } else {
      await sleep(Math.min(nextFireAt - now, 5));
    }

    // Progress every 5s.
    if (now - lastProgress >= 5000) {
      const elapsed = (now - loopStart) / 1000;
      const actualRate = succeeded / elapsed;
      console.log(
        `[stress] t=${elapsed.toFixed(0)}s sent=${attempted} ok=${succeeded} fail=${failed} ` +
          `inflight=${inFlight} rate=${actualRate.toFixed(1)}/s`,
      );
      lastProgress = now;
    }
  }

  // Sustained rate is the throughput we actually fired at, measured over the firing
  // window only. Measuring over the post-loop drain would deflate it: trailing in-flight
  // calls settling after the loop ends would divide the same success count by a longer
  // wall clock, reporting a low rate even when we fired at the target the whole time.
  const firingDuration = (performance.now() - loopStart) / 1000;

  console.log(`[stress] firing done, waiting for ${inFlight} in-flight calls to settle`);
  await Promise.allSettled([...pending]);

  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  const sustainedRate = attempted / firingDuration;

  console.log(
    `[stress] latency p50=${fmtMs(p50)} p95=${fmtMs(p95)} p99=${fmtMs(p99)} ` +
      `sustained=${sustainedRate.toFixed(1)}/s`,
  );

  await client.mutation(api.stressTest.recordRunResults, {
    runId,
    completedAt: Date.now(),
    totalAttempted: attempted,
    totalSucceeded: succeeded,
    totalFailed: failed,
    p50LatencyMs: p50,
    p95LatencyMs: p95,
    p99LatencyMs: p99,
  });

  // --- Drain check --------------------------------------------------------
  console.log(`[stress] waiting ${DRAIN_WAIT_SECONDS}s for scheduler to drain deliveries`);
  await sleep(DRAIN_WAIT_SECONDS * 1000);
  const stats = await client.query(api.stressTest.getDeliveryStats, {
    workspaceId,
  });
  const deliveryRatio = stats.total > 0 ? stats.delivered / stats.total : 1;
  console.log(
    `[stress] delivery stats total=${stats.total} delivered=${stats.delivered} ` +
      `delivering=${stats.delivering} received=${stats.received} failed=${stats.failed}`,
  );

  // --- Evaluate -----------------------------------------------------------
  const checks = [
    { name: 'zero ingress failures', pass: failed === 0, detail: `${failed} failed` },
    {
      name: `p95 < ${THRESHOLDS.p95Ms}ms`,
      pass: p95 < THRESHOLDS.p95Ms,
      detail: fmtMs(p95),
    },
    {
      name: `p99 < ${THRESHOLDS.p99Ms}ms`,
      pass: p99 < THRESHOLDS.p99Ms,
      detail: fmtMs(p99),
    },
    {
      name: `sustained rate >= ${THRESHOLDS.sustainedRateRatio * 100}% of target`,
      pass: sustainedRate >= RATE * THRESHOLDS.sustainedRateRatio,
      detail: `${sustainedRate.toFixed(1)}/${RATE}`,
    },
    {
      name: `delivery completion >= ${THRESHOLDS.deliveryCompletionRatio * 100}%`,
      pass: deliveryRatio >= THRESHOLDS.deliveryCompletionRatio,
      detail: `${(deliveryRatio * 100).toFixed(1)}%`,
    },
  ];

  console.log('\n[stress] === RESULTS ===');
  for (const c of checks) {
    console.log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name} (${c.detail})`);
  }
  const allPass = checks.every((c) => c.pass);
  console.log(`[stress] OVERALL: ${allPass ? 'PASS' : 'FAIL'}\n`);

  // --- Teardown -----------------------------------------------------------
  if (KEEP_DATA) {
    console.log('[stress] STRESS_KEEP_DATA=1 set; leaving test data in place');
  } else {
    const deleted = await client.mutation(api.stressTest.teardownAll, {
      workspaceId,
    });
    console.log(
      `[stress] torn down: events=${deleted.eventsDeleted} attempts=${deleted.attemptsDeleted} ` +
        `sources=${deleted.sourcesDeleted} counters=${deleted.countersDeleted}`,
    );
  }

  return allPass ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('FATAL:', err);
    process.exit(2);
  });
