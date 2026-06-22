// Outbound delivery: the push-driven retry engine (SPEC §7.2, FR-OUT-*).
//
// internal.delivery.attempt is scheduled by the ingress mutation (runAfter 0) and re-schedules
// itself on failure per the backoff schedule until success or dead-letter. Each attempt:
//   1. load event + source context (and reconstruct the byte-for-byte body),
//   2. POST it to the forward URL with the four X-Eventsnare-* headers and a 30s timeout,
//   3. record a deliveryAttempt and transition event status, scheduling the next retry.
// No polling — every retry is a durable scheduled function (survives deploys/restarts).

import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { claimOnce, bumpFailBurst } from './alerts/dispatch';
import { bumpDeliveryStats } from './lib/deliveryStats';
import { decryptSecret } from './lib/crypto';
import { isReservedForwardHeader } from './lib/forwardHeaders';
import { hmacSha256, toHex } from './providers/hmac';

// SPEC FR-OUT-6 backoff: 10s, 30s, 2m, 10m, 1h, 6h, 24h. Index = attemptNumber - 1.
const BACKOFF_MS = [
  10_000, 30_000, 120_000, 600_000, 3_600_000, 21_600_000, 86_400_000,
] as const;

const DELIVERY_TIMEOUT_MS = 30_000; // SPEC FR-OUT-7
const MAX_RESPONSE_BODY = 4_096; // store at most 4KB of the customer's response
const FAIL_BURST_THRESHOLD = 10; // SPEC FR-ALERT-1: >10 failures in a 5-minute window

export const getDeliveryContext = internalQuery({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) return null;
    const source = await ctx.db.get(event.sourceId);
    if (!source) return null;
    return {
      eventId: event._id,
      sourceId: event.sourceId,
      attemptCount: event.attemptCount,
      rawBodyInline: event.rawBodyInline,
      rawBodyStorageId: event.rawBodyStorageId,
      headersJson: event.headersJson,
      originalSignature: event.originalSignature,
      forwardUrl: source.forwardUrl,
      provider: source.provider,
      forwardHeaders: source.forwardHeaders,
      outboundSigningSecretEncrypted: source.outboundSigningSecretEncrypted,
    };
  },
});

export const attempt = internalAction({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }): Promise<void> => {
    const fwd = await ctx.runQuery(internal.delivery.getDeliveryContext, { eventId });
    if (!fwd) return; // event or source gone; nothing to deliver

    // Reconstruct the original body byte-for-byte (inline or from File Storage).
    let body = fwd.rawBodyInline ?? '';
    if (!fwd.rawBodyInline && fwd.rawBodyStorageId) {
      const blob = await ctx.storage.get(fwd.rawBodyStorageId);
      body = blob ? await blob.text() : '';
    }

    const attemptNumber = fwd.attemptCount + 1;
    const originalContentType = parseContentType(fwd.headersJson);
    const startedAt = Date.now();

    // Reserved headers Eventsnare controls; custom headers may not override them (FR P2).
    const headers: Record<string, string> = {
      'Content-Type': originalContentType,
      'X-Eventsnare-Event-Id': fwd.eventId,
      'X-Eventsnare-Attempt': String(attemptNumber),
      'X-Eventsnare-Source': fwd.sourceId,
      'X-Eventsnare-Original-Signature': fwd.originalSignature ?? '',
    };

    // Outbound signature: HMAC-SHA256 over `${timestamp}.${body}`, Stripe-style, so customers
    // can verify the request came from Eventsnare. Only present once the source has a secret.
    // A crypto failure (e.g. key rotation, corrupted blob) must NOT block delivery: skip the
    // signature rather than throwing, matching the forward-headers fail-open behavior below.
    if (fwd.outboundSigningSecretEncrypted) {
      try {
        const secret = await decryptSecret(fwd.outboundSigningSecretEncrypted);
        const t = Math.floor(startedAt / 1000);
        const signature = toHex(await hmacSha256(secret, `${t}.${body}`));
        headers['X-Eventsnare-Signature'] = `t=${t},v1=${signature}`;
      } catch {
        // sign-best-effort: deliver unsigned rather than dead-letter the event
      }
    }

    // Custom forward headers (decrypted), merged last but never over a reserved name.
    if (fwd.forwardHeaders) {
      const custom = await decryptForwardHeaders(fwd.forwardHeaders);
      for (const [key, value] of Object.entries(custom)) {
        if (!isReservedForwardHeader(key)) headers[key] = value;
      }
    }

    // Local-dev forwarding (P5): if a CLI `eventsnare listen` session is active for this source,
    // hand the fully-built request to that session's queue instead of POSTing to the production
    // forward URL. The CLI drains the queue and reports the outcome (cliDelivery.ackDelivery).
    const session = await ctx.runQuery(internal.cliSessions.findActiveSession, {
      sourceId: fwd.sourceId,
    });
    if (session) {
      await ctx.runMutation(internal.cliDelivery.createLocalDelivery, {
        eventId,
        sessionId: session.sessionId,
        attemptNumber,
        headersJson: JSON.stringify(headers),
      });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
    try {
      const response = await fetch(fwd.forwardUrl, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
      const responseText = (await response.text()).slice(0, MAX_RESPONSE_BODY);
      await ctx.runMutation(internal.delivery.recordAttemptResult, {
        eventId,
        startedAt,
        completedAt: Date.now(),
        statusCode: response.status,
        responseBodyTruncated: responseText,
        success: response.status >= 200 && response.status < 300,
      });
    } catch (err) {
      await ctx.runMutation(internal.delivery.recordAttemptResult, {
        eventId,
        startedAt,
        completedAt: Date.now(),
        errorMessage: err instanceof Error ? err.message : 'Delivery request failed',
        success: false,
      });
    } finally {
      clearTimeout(timeout);
    }
  },
});

async function decryptForwardHeaders(blob: string): Promise<Record<string, string>> {
  try {
    const json = await decryptSecret(blob);
    const parsed = JSON.parse(json) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // malformed or undecryptable headers must not block delivery
  }
  return {};
}

function parseContentType(headersJson?: string): string {
  if (!headersJson) return 'application/json';
  try {
    const headers = JSON.parse(headersJson) as Record<string, string>;
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === 'content-type') return value;
    }
  } catch {
    // fall through to default
  }
  return 'application/json';
}

export const recordAttemptResult = internalMutation({
  args: {
    eventId: v.id('events'),
    startedAt: v.number(),
    completedAt: v.number(),
    statusCode: v.optional(v.number()),
    responseBodyTruncated: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    success: v.boolean(),
  },
  handler: async (ctx, args): Promise<void> => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error(`Event not found: ${args.eventId}`);
    const source = await ctx.db.get(event.sourceId);
    if (!source) throw new Error(`Source not found: ${event.sourceId}`);

    const attemptNumber = event.attemptCount + 1;
    await ctx.db.insert('deliveryAttempts', {
      eventId: args.eventId,
      attemptNumber,
      startedAt: args.startedAt,
      completedAt: args.completedAt,
      statusCode: args.statusCode,
      responseBodyTruncated: args.responseBodyTruncated,
      errorMessage: args.errorMessage,
    });

    // Roll this attempt into the per-source hourly stats (P3) and denormalize its outcome onto
    // the event so the dashboard can filter by last delivery result without a join (P4).
    const deadLettered = !args.success && attemptNumber >= source.maxRetries;
    await bumpDeliveryStats(ctx, {
      workspaceId: event.workspaceId,
      sourceId: event.sourceId,
      completedAt: args.completedAt,
      latencyMs: args.completedAt - args.startedAt,
      success: args.success,
      statusCode: args.statusCode,
      deadLettered,
    });
    const lastOutcome = {
      lastStatusCode: args.statusCode,
      lastErrorMessage: args.errorMessage,
    };

    if (args.success) {
      await ctx.db.patch(args.eventId, {
        status: 'delivered',
        attemptCount: attemptNumber,
        ...lastOutcome,
      });
      return;
    }

    // Failure-burst alert (FR-ALERT-1): count failures per source in 5-minute windows and
    // fire once when the window crosses the threshold.
    const burstCount = await bumpFailBurst(ctx, event.workspaceId, event.sourceId, Date.now());
    if (burstCount === FAIL_BURST_THRESHOLD) {
      await ctx.scheduler.runAfter(0, internal.alerts.dispatch.dispatchAlert, {
        workspaceId: event.workspaceId,
        type: 'delivery_failure',
        subject: `Delivery failures spiking for "${source.name}"`,
        message: `Source "${source.name}" has failed more than ${FAIL_BURST_THRESHOLD} deliveries in the last 5 minutes. Check the forward URL.`,
      });
    }

    // Failure: retry until the source's max, then dead-letter (FR-OUT-6, FR-OUT-8).
    if (attemptNumber >= source.maxRetries) {
      await ctx.db.patch(args.eventId, {
        status: 'deadLetter',
        attemptCount: attemptNumber,
        deadLetterAt: Date.now(),
        nextAttemptAt: undefined,
        ...lastOutcome,
      });
      // Dead-letter alert (FR-ALERT-2), once per event.
      if (await claimOnce(ctx, event.workspaceId, `deadletter:${args.eventId}`)) {
        await ctx.scheduler.runAfter(0, internal.alerts.dispatch.dispatchAlert, {
          workspaceId: event.workspaceId,
          type: 'dead_letter',
          subject: `Event dead-lettered (${event.eventType})`,
          message: `Event ${args.eventId} (${event.eventType}) from "${source.name}" reached the dead-letter state after ${attemptNumber} attempts. Replay it from the dashboard once the endpoint is healthy.`,
        });
      }
      return;
    }

    const delay = BACKOFF_MS[Math.min(attemptNumber - 1, BACKOFF_MS.length - 1)]!;
    const nextAttemptAt = Date.now() + delay;
    await ctx.db.patch(args.eventId, {
      status: 'failed',
      attemptCount: attemptNumber,
      nextAttemptAt,
      ...lastOutcome,
    });
    await ctx.scheduler.runAfter(delay, internal.delivery.attempt, {
      eventId: args.eventId,
    });
  },
});
