import { useAction, useQuery } from 'convex/react';
import { PlanCard } from '@/features/stripe-payments/components/PlanCard';
import { api } from '@convex/_generated/api';

interface PlanRow {
  _id: string;
  stripePriceId: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year' | 'one-time';
  features: string[];
}

export function Pricing() {
  const plans = useQuery(api.stripe.listPlans);
  const subscription = useQuery(api.stripe.getMySubscription);
  const createCheckoutSession = useAction(api.stripeActions.createCheckoutSession);

  const handleSubscribe = async (priceId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { url } = await createCheckoutSession({
      priceId,
      successUrl: `${origin}/billing?status=success`,
      cancelUrl: `${origin}/pricing?status=canceled`,
    });
    if (url) window.location.href = url;
  };

  const currentPriceId = subscription?.subscription?.stripePriceId ?? null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a plan that fits your needs.
        </p>
      </div>
      {plans === undefined ? (
        <p className="text-center text-sm text-muted-foreground">Loading plans…</p>
      ) : plans.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No plans configured. Seed the plans table in Convex to enable subscriptions.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan: PlanRow) => (
            <PlanCard
              key={plan._id}
              name={plan.name}
              description={plan.description}
              priceCents={plan.priceCents}
              currency={plan.currency}
              interval={plan.interval}
              features={plan.features}
              isCurrent={plan.stripePriceId === currentPriceId}
              onSubscribe={() => void handleSubscribe(plan.stripePriceId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
