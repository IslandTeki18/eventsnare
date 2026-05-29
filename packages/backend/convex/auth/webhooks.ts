import { Webhook } from 'svix';
import { httpAction } from '../_generated/server';
import { internal } from '../_generated/api';

export const clerkWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response('Missing CLERK_WEBHOOK_SECRET', { status: 500 });
  }

  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await request.text();
  let event: any;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  const { type, data } = event;

  if (type === 'user.created' || type === 'user.updated') {
    const email = data.email_addresses?.[0]?.email_address ?? '';
    const name =
      [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined;
    await ctx.runMutation(internal.auth.users.syncUser, {
      clerkId: data.id,
      email,
      name,
      imageUrl: data.image_url ?? undefined,
    });
  } else if (type === 'user.deleted') {
    await ctx.runMutation(internal.auth.users.deleteUser, {
      clerkId: data.id,
    });
  }

  return new Response('ok', { status: 200 });
});
