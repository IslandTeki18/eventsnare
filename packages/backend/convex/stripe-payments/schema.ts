import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const stripeTables = {
  plans: defineTable({
    stripePriceId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    priceCents: v.number(),
    currency: v.string(),
    interval: v.union(v.literal('month'), v.literal('year'), v.literal('one-time')),
    features: v.array(v.string()),
    isActive: v.boolean(),
  }).index('byStripePriceId', ['stripePriceId']),
  subscriptions: defineTable({
    userId: v.id('users'),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  })
    .index('byUserId', ['userId'])
    .index('byStripeCustomerId', ['stripeCustomerId'])
    .index('byStripeSubscriptionId', ['stripeSubscriptionId']),
  payments: defineTable({
    userId: v.id('users'),
    stripePaymentIntentId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    status: v.string(),
    createdAt: v.number(),
  })
    .index('byUserId', ['userId'])
    .index('byStripePaymentIntentId', ['stripePaymentIntentId']),
  stripeCustomers: defineTable({
    userId: v.id('users'),
    stripeCustomerId: v.string(),
  })
    .index('byUserId', ['userId'])
    .index('byStripeCustomerId', ['stripeCustomerId']),
};

export default stripeTables;
