import { v } from 'convex/values';
import { internalMutation, internalQuery, query } from './_generated/server';

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

export const getStripeCustomerByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('byClerkId', (q) => q.eq('clerkId', clerkId))
      .unique();
    if (!user) throw new Error('User record not yet synced from Clerk');
    const existing = await ctx.db
      .query('stripeCustomers')
      .withIndex('byUserId', (q) => q.eq('userId', user._id))
      .unique();
    return { userId: user._id, stripeCustomerId: existing?.stripeCustomerId ?? null };
  },
});

export const insertStripeCustomer = internalMutation({
  args: { userId: v.id('users'), stripeCustomerId: v.string() },
  handler: async (ctx, { userId, stripeCustomerId }) => {
    const existing = await ctx.db
      .query('stripeCustomers')
      .withIndex('byUserId', (q) => q.eq('userId', userId))
      .unique();
    if (existing) return existing.stripeCustomerId;
    await ctx.db.insert('stripeCustomers', { userId, stripeCustomerId });
    return stripeCustomerId;
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
