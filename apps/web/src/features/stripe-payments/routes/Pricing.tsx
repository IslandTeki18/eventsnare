import { useAction, useQuery } from 'convex/react';
import { useState } from 'react';
import { PlanCard } from '@/features/stripe-payments/components/PlanCard';
import {
  ANNUAL_MONTHS_FREE,
  PLAN_CATALOG,
  type PlanInterval,
} from '@/features/stripe-payments/lib/catalog';
import { api } from '@convex/_generated/api';

interface PlanRow {
  stripePriceId: string;
  name: string;
  interval: 'month' | 'year' | 'one-time';
}

export function Pricing() {
  const [interval, setInterval] = useState<PlanInterval>('month');
  const plans = useQuery(api.stripe.listPlans);
  const subscription = useQuery(api.stripe.getMySubscription);
  const createCheckoutSession = useAction(api.stripeActions.createCheckoutSession);

  // ponytail: checkout price IDs come from the (currently empty) `plans` table,
  // keyed by tier name + interval. Seed that table to light up Subscribe buttons.
  const priceByKey = new Map<string, string>(
    ((plans as PlanRow[] | undefined) ?? []).map((p) => [
      `${p.name.toLowerCase()}:${p.interval}`,
      p.stripePriceId,
    ]),
  );

  const currentTier = subscription?.plan?.name?.toLowerCase() ?? 'free';

  const handleSubscribe = async (priceId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { url } = await createCheckoutSession({
      priceId,
      successUrl: `${origin}/billing?status=success`,
      cancelUrl: `${origin}/pricing?status=canceled`,
    });
    if (url) window.location.href = url;
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Webhooks that survive your code. Cancel anytime.
        </p>
        <div className="mt-6 inline-flex rounded-md border border-border p-1 text-sm">
          <button
            type="button"
            onClick={() => setInterval('month')}
            className={`rounded px-3 py-1 ${interval === 'month' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval('year')}
            className={`rounded px-3 py-1 ${interval === 'year' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
          >
            Annual ({ANNUAL_MONTHS_FREE} months free)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {PLAN_CATALOG.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const isFree = plan.monthlyCents === 0;
          const priceId = priceByKey.get(`${plan.name.toLowerCase()}:${interval}`);

          let actionLabel = 'Subscribe';
          let actionDisabled = false;
          if (isFree) {
            actionLabel = 'Get started';
            actionDisabled = true; // Free is the default plan; nothing to purchase.
          } else if (!priceId) {
            actionLabel = 'Coming soon';
            actionDisabled = true;
          }

          return (
            <PlanCard
              key={plan.tier}
              plan={plan}
              interval={interval}
              isCurrent={isCurrent}
              actionLabel={actionLabel}
              actionDisabled={actionDisabled}
              onAction={() => priceId && void handleSubscribe(priceId)}
            />
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Overages on Indie, Startup, and Growth at $0.50 per 1,000 events (opt-in).
        Free tier is hard-capped at 10,000 events/mo.
      </p>
    </div>
  );
}
