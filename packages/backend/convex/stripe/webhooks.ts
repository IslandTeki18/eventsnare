'use node';

import Stripe from 'stripe';
import { httpAction } from '../_generated/server';
import { internal } from '../_generated/api';

export const stripeWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !apiKey) {
    return new Response('Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY', { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const stripe = new Stripe(apiKey, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion });
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    return new Response(`Invalid signature: ${err instanceof Error ? err.message : 'unknown'}`, {
      status: 400,
    });
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    const priceId = sub.items.data[0]?.price.id ?? '';
    await ctx.runMutation(internal.stripe.upsertSubscription, {
      stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end * 1000,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const priceId = sub.items.data[0]?.price.id ?? '';
    await ctx.runMutation(internal.stripe.upsertSubscription, {
      stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status: 'canceled',
      currentPeriodEnd: sub.current_period_end * 1000,
      cancelAtPeriodEnd: false,
    });
  } else if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;
    if (intent.customer) {
      await ctx.runMutation(internal.stripe.recordPayment, {
        stripeCustomerId: typeof intent.customer === 'string' ? intent.customer : intent.customer.id,
        stripePaymentIntentId: intent.id,
        amountCents: intent.amount,
        currency: intent.currency,
        status: intent.status,
      });
    }
  }

  return new Response('ok', { status: 200 });
});
