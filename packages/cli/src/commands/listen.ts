// `eventsnare listen --source <id> --forward <localUrl>`. Opens a listen session and drains the
// per-session delivery queue over a reactive subscription, forwarding each webhook to the local
// URL byte-for-byte and reporting the outcome back to the backend.

import { parseArgs } from 'node:util';
import { requireConfig } from '../lib/config.js';
import { httpClient, wsClient } from '../lib/convexClient.js';
import { forwardToLocal } from '../lib/forwardRequest.js';
import { refs, type PendingDelivery } from '../lib/refs.js';

const HEARTBEAT_INTERVAL_MS = 10_000;

export async function listen(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      source: { type: 'string' },
      forward: { type: 'string' },
    },
    allowPositionals: false,
  });

  if (!values.source) {
    console.error('Missing --source <id>.');
    return 1;
  }
  if (!values.forward) {
    console.error('Missing --forward <url>, e.g. http://localhost:3000/webhook.');
    return 1;
  }
  const sourceId = values.source;
  const forwardUrl = values.forward;

  const config = requireConfig();
  const http = httpClient(config.convexUrl);

  // Confirm the source belongs to this token's workspace before opening a session.
  const sources = await http.action(refs.listSources, { token: config.token });
  const source = sources.find((s) => s._id === sourceId);
  if (!source) {
    console.error(`Source ${sourceId} not found in this workspace.`);
    return 1;
  }

  const { sessionId, secret } = await http.action(refs.registerSession, {
    token: config.token,
    sourceId,
  });

  console.log(`Listening on "${source.name}" (${source.provider}).`);
  console.log(`Forwarding to ${forwardUrl}. Press Ctrl+C to stop.`);

  const client = wsClient(config.convexUrl);
  const inFlight = new Set<string>();
  let stopped = false;

  const handle = async (row: PendingDelivery): Promise<void> => {
    if (inFlight.has(row.localDeliveryId)) return;
    inFlight.add(row.localDeliveryId);
    try {
      const { claimed } = await client.mutation(refs.claimDelivery, {
        sessionId,
        secret,
        localDeliveryId: row.localDeliveryId,
      });
      if (!claimed) return;

      const result = await forwardToLocal({
        url: forwardUrl,
        headers: row.headers,
        body: row.body,
        bodyStorageUrl: row.bodyStorageUrl,
      });

      await client.mutation(refs.ackDelivery, {
        sessionId,
        secret,
        localDeliveryId: row.localDeliveryId,
        statusCode: result.statusCode,
        errorMessage: result.errorMessage,
        latencyMs: result.latencyMs,
      });

      const outcome = result.statusCode !== undefined ? `${result.statusCode}` : result.errorMessage;
      console.log(
        `${new Date().toISOString()}  ${row.eventId}  ->  ${outcome}  (${result.latencyMs}ms)`,
      );
    } finally {
      inFlight.delete(row.localDeliveryId);
    }
  };

  const unsubscribe = client.onUpdate(
    refs.pending,
    { sessionId, secret },
    (rows) => {
      for (const row of rows) void handle(row);
    },
    (err) => {
      console.error('Subscription error:', err.message);
    },
  );

  const heartbeat = setInterval(() => {
    void (async () => {
      try {
        const { active } = await http.mutation(refs.heartbeat, { sessionId, secret });
        if (!active && !stopped) {
          console.error('Session ended (token revoked or expired). Exiting.');
          await shutdown(1);
        }
      } catch {
        // transient network error; next tick retries
      }
    })();
  }, HEARTBEAT_INTERVAL_MS);

  const shutdown = async (code: number): Promise<void> => {
    if (stopped) return;
    stopped = true;
    clearInterval(heartbeat);
    unsubscribe();
    try {
      await http.mutation(refs.endSession, { sessionId, secret });
    } catch {
      // best effort
    }
    await client.close();
    process.exit(code);
  };

  process.on('SIGINT', () => void shutdown(0));
  process.on('SIGTERM', () => void shutdown(0));

  // Keep the process alive; resolution happens via process.exit in shutdown.
  return await new Promise<number>(() => {});
}
