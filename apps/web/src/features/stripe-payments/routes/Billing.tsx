import { useAction, useQuery } from 'convex/react';
import { Link } from 'react-router';
import { ProtectedRoute } from '@/features/auth';
import { SubscriptionStatus } from '@/features/stripe-payments/components/SubscriptionStatus';
import { api } from '@convex/_generated/api';

export function Billing() {
  const data = useQuery(api.stripe.getMySubscription);
  const createPortalSession = useAction(api.stripeActions.createPortalSession);

  const handleOpenPortal = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { url } = await createPortalSession({ returnUrl: `${origin}/billing` });
    if (url) window.location.href = url;
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Billing</h1>
        {data === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data === null ? (
          <div className="rounded-lg border border-border bg-background p-6">
            <p className="text-sm text-muted-foreground">
              You don't have an active subscription.
            </p>
            <Link
              to="/pricing"
              className="mt-3 inline-block rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
            >
              View plans
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SubscriptionStatus
              planName={data.plan?.name ?? null}
              status={data.subscription.status}
              currentPeriodEnd={data.subscription.currentPeriodEnd}
              cancelAtPeriodEnd={data.subscription.cancelAtPeriodEnd}
            />
            <button
              type="button"
              onClick={() => void handleOpenPortal()}
              className="self-start rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Manage billing in Stripe
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
