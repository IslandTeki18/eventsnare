import { useAction, useQuery } from 'convex/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { ProtectedRoute } from '@/features/auth';
import { SubscriptionStatus } from '@/features/stripe-payments/components/SubscriptionStatus';
import { PLAN_CATALOG } from '@/features/stripe-payments/lib/catalog';
import { useWorkspace } from '@/features/workspace/workspaceContext';
import { api } from '@convex/_generated/api';

export function Billing() {
  const workspace = useWorkspace();
  const data = useQuery(api.stripe.getMySubscription);
  const createPortalSession = useAction(api.stripeActions.createPortalSession);

  // ponytail: display-only. Overage metering (FR-BILL-4) is not wired to the
  // backend yet; persist this via a workspace flag + Stripe meter when built.
  const [overageOptIn, setOverageOptIn] = useState(false);

  const tier = PLAN_CATALOG.find((p) => p.tier === workspace.plan);
  const overageEligible = tier?.overageEligible ?? false;

  const handleOpenPortal = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { url } = await createPortalSession({ returnUrl: `${origin}/billing` });
    if (url) window.location.href = url;
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          to="/"
          className="mb-4 inline-block text-sm text-muted-foreground underline hover:text-foreground"
        >
          ← Back to app
        </Link>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Billing</h1>
        {data === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data === null ? (
          <div className="rounded-lg border border-border bg-background p-6">
            <p className="text-sm text-muted-foreground">
              You're on the Free plan.
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

        {overageEligible ? (
          <label className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-sm">
            <input
              type="checkbox"
              checked={overageOptIn}
              onChange={(e) => setOverageOptIn(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Allow overages</span>
              <span className="block text-muted-foreground">
                Keep delivering past your plan limit at $0.50 per 1,000 extra events.
                Off by default; your plan is hard-capped.
              </span>
            </span>
          </label>
        ) : null}

        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Cancelling keeps your data for 60 days, then it is permanently deleted.
          </span>
          <Link to="/usage" className="underline hover:text-foreground">
            View usage
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
