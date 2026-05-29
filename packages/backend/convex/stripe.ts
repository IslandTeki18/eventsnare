'use node';

import { v } from 'convex/values';
import Stripe from 'stripe';
import { action, internalMutation, query } from './_generated/server';
import { internal } from './_generated/api';

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion });
}

export const listPlans = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db.query('plans').collect();
    return plans.filter((plan) => plan.isActive);
  },
});

export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();
    if (!user) return null;
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .unique();
    if (!subscription) return null;
    const plan = await ctx.db
      .query('plans')
      .withIndex('byStripePriceId', (q) => q.eq('stripePriceId', subscription.stripePriceId))
      .unique();
    return { subscription, plan };
  },
});

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
    const customerId: string = await ctx.runMutation(
      internal.stripe.getOrCreateStripeCustomer,
      { clerkId: identity.subject, email: identity.email ?? '' },
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
    const customerId: string = await ctx.runMutation(
      internal.stripe.getOrCreateStripeCustomer,
      { clerkId: identity.subject, email: identity.email ?? '' },
    );
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  },
});

export const getOrCreateStripeCustomer = internalMutation({
  args: { clerkId: v.string(), email: v.string() },
  handler: async (ctx, { clerkId, email }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', clerkId))
      .unique();
    if (!user) throw new Error('User record not yet synced from Clerk');
    const existing = await ctx.db
      .query('stripeCustomers')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .unique();
    if (existing) return existing.stripeCustomerId;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
    const stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion });
    const customer = await stripe.customers.create({
      email,
      metadata: { clerkId, userId: user._id },
    });
    await ctx.db.insert('stripeCustomers', {
      userId: user._id,
      stripeCustomerId: customer.id,
    });
    return customer.id;
  },
});

export const upsertSubscription = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const customerLink = await ctx.db
      .query('stripeCustomers')
      .withIndex('byStripeCustomerId', (q) => q.eq('stripeCustomerId', args.stripeCustomerId))
      .unique();
    if (!customerLink) return;
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('byStripeSubscriptionId', (q) => q.eq('stripeSubscriptionId', args.stripeSubscriptionId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        stripePriceId: args.stripePriceId,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      });
      return;
    }
    await ctx.db.insert('subscriptions', {
      userId: customerLink.userId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      status: args.status,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
    });
  },
});

export const recordPayment = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    stripePaymentIntentId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const customerLink = await ctx.db
      .query('stripeCustomers')
      .withIndex('byStripeCustomerId', (q) => q.eq('stripeCustomerId', args.stripeCustomerId))
      .unique();
    if (!customerLink) return;
    const existing = await ctx.db
      .query('payments')
      .withIndex('byStripePaymentIntentId', (q) =>
        q.eq('stripePaymentIntentId', args.stripePaymentIntentId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { status: args.status });
      return;
    }
    await ctx.db.insert('payments', {
      userId: customerLink.userId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      amountCents: args.amountCents,
      currency: args.currency,
      status: args.status,
      createdAt: Date.now(),
    });
  },
});
