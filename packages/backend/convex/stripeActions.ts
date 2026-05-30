'use node';

import { v } from 'convex/values';
import Stripe from 'stripe';
import { action, type ActionCtx } from './_generated/server';
import { internal } from './_generated/api';

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion });
}

async function ensureStripeCustomer(
  ctx: ActionCtx,
  stripe: Stripe,
  clerkId: string,
  email: string,
): Promise<string> {
  const { userId, stripeCustomerId } = await ctx.runQuery(
    internal.stripe.getStripeCustomerByClerkId,
    { clerkId },
  );
  if (stripeCustomerId) return stripeCustomerId;
  const customer = await stripe.customers.create({
    email,
    metadata: { clerkId, userId },
  });
  return ctx.runMutation(internal.stripe.insertStripeCustomer, {
    userId,
    stripeCustomerId: customer.id,
  });
}

export const createCheckoutSession = action({
  args: {
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, { priceId, successUrl, cancelUrl }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const stripe = stripeClient();
    const customerId = await ensureStripeCustomer(
      ctx,
      stripe,
      identity.subject,
      identity.email ?? '',
    );
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return { url: session.url };
  },
});

export const createPortalSession = action({
  args: { returnUrl: v.string() },
  handler: async (ctx, { returnUrl }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const stripe = stripeClient();
    const customerId = await ensureStripeCustomer(
      ctx,
      stripe,
      identity.subject,
      identity.email ?? '',
    );
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  },
});
