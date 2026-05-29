'use node';

import { v } from 'convex/values';
import webpush from 'web-push';
import { internal } from './_generated/api';
import { action } from './_generated/server';

interface SendResult {
  sent: number;
  failed: number;
  removed: number;
}

/**
 * Send a test push notification to every device the current user has subscribed.
 * Runs in the Node runtime because web-push uses Node crypto for VAPID signing
 * and RFC 8291 payload encryption. Dead endpoints (404/410) are pruned.
 */
export const sendTestPush = action({
  args: {
    title: v.optional(v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx, { title, body }): Promise<SendResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject) {
      throw new Error(
        'Missing VAPID env. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT via `npx convex env set`.',
      );
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const subscriptions = await ctx.runQuery(internal.pushSubscriptions.listMineWithKeys);

    const payload = JSON.stringify({
      title: title ?? 'Test push',
      body: body ?? 'It works — this push came from Convex.',
      url: '/',
    });

    const result: SendResult = { sent: 0, failed: 0, removed: 0 };

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload,
        );
        result.sent += 1;
      } catch (error) {
        result.failed += 1;
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await ctx.runMutation(internal.pushSubscriptions.deleteByEndpoint, {
            endpoint: sub.endpoint,
          });
          result.removed += 1;
        }
      }
    }

    return result;
  },
});
