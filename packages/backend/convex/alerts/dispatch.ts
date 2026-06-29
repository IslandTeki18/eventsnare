// Alert dispatch (SPEC §4.6). Two layers:
//
//   1. Idempotency/anti-spam helpers (claimOnce, bumpFailBurst) run INSIDE the triggering
//      mutation (delivery.recordAttemptResult, ingress persist) so the decision to fire is
//      transactional and races cannot double-claim a key.
//   2. dispatchAlert is an internalAction scheduled via runAfter(0) once a claim succeeds. It
//      performs the network I/O (Resend email, Slack webhook POST). A failure in one channel
//      is logged, never thrown: alerting must never break delivery or ingress.

import { v } from 'convex/values';
import { internalAction, internalQuery } from '../_generated/server';
import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import { sendEmail } from '../lib/email';

const FAIL_BURST_BUCKET_MS = 300_000; // 5-minute window (SPEC FR-ALERT-1)

export const ALERT_TYPE = v.union(
  v.literal('delivery_failure'),
  v.literal('dead_letter'),
  v.literal('quota'),
);

export type AlertType = 'delivery_failure' | 'dead_letter' | 'quota';

// Claim a one-shot alert key. Returns true on first claim, false if already fired. Caller
// schedules dispatchAlert only when this returns true.
export async function claimOnce(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  key: string,
): Promise<boolean> {
  const existing = await ctx.db
    .query('alertState')
    .withIndex('by_workspace_key', (q) => q.eq('workspaceId', workspaceId).eq('key', key))
    .first();
  if (existing) return false;
  await ctx.db.insert('alertState', { workspaceId, key, firedAt: Date.now() });
  return true;
}

// Rolling per-source failure counter bucketed into 5-minute windows. Returns the new count;
// the caller fires the burst alert exactly when the count reaches the threshold.
export async function bumpFailBurst(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  sourceId: Id<'sources'>,
  nowMs: number,
): Promise<number> {
  const bucket = Math.floor(nowMs / FAIL_BURST_BUCKET_MS);
  const key = `failburst:${sourceId}:${bucket}`;
  const existing = await ctx.db
    .query('alertState')
    .withIndex('by_workspace_key', (q) => q.eq('workspaceId', workspaceId).eq('key', key))
    .first();
  if (!existing) {
    await ctx.db.insert('alertState', { workspaceId, key, firedAt: nowMs, count: 1 });
    return 1;
  }
  const next = (existing.count ?? 0) + 1;
  await ctx.db.patch(existing._id, { count: next });
  return next;
}

export const getEnabledAlerts = internalQuery({
  args: { workspaceId: v.id('workspaces'), type: ALERT_TYPE },
  handler: async (ctx, { workspaceId, type }) => {
    const rows = await ctx.db
      .query('alerts')
      .withIndex('by_workspace_type', (q) =>
        q.eq('workspaceId', workspaceId).eq('type', type),
      )
      .collect();
    return rows
      .filter((r) => r.enabled && r.target.trim().length > 0)
      .map((r) => ({ channel: r.channel, target: r.target }));
  },
});

export const dispatchAlert = internalAction({
  args: {
    workspaceId: v.id('workspaces'),
    type: ALERT_TYPE,
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { workspaceId, type, subject, message }): Promise<void> => {
    // Always-on in-app channel: record the alert in the owner's inbox regardless of
    // email/Slack config. Wrapped so a notification failure never breaks dispatch.
    try {
      await ctx.runMutation(internal.notifications.notifyWorkspaceOwner, {
        workspaceId,
        type,
        title: subject,
        body: message,
      });
    } catch (err) {
      console.error(
        JSON.stringify({
          msg: 'inapp_notify_failed',
          error: err instanceof Error ? err.message : 'unknown',
        }),
      );
    }

    const targets = await ctx.runQuery(internal.alerts.dispatch.getEnabledAlerts, {
      workspaceId,
      type,
    });
    for (const { channel, target } of targets) {
      if (channel === 'email') {
        await sendEmail({ to: target, subject, html: `<p>${escapeHtml(message)}</p>` });
      } else {
        await postSlack(target, `*${subject}*\n${message}`);
      }
    }
  },
});

async function postSlack(webhookUrl: string, text: string): Promise<void> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error(JSON.stringify({ msg: 'slack_send_failed', status: res.status }));
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        msg: 'slack_send_error',
        error: err instanceof Error ? err.message : 'unknown',
      }),
    );
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
