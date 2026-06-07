import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { ProtectedRoute } from '@/features/auth';

// Usage page (SPEC FR-DASH-7): current billing period event count against the plan limit,
// with overage warnings at 80% and 100%. Reactive via the Convex usage query.

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function Usage() {
  const usage = useQuery(api.usage.getCurrent);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Usage</h1>

        {usage === undefined ? (
          <div className="rounded-lg border border-border bg-background p-8 text-center text-sm text-muted-foreground">
            Loading usage…
          </div>
        ) : (
          <UsageCard usage={usage} />
        )}
      </div>
    </ProtectedRoute>
  );
}

interface UsageData {
  plan: string;
  billingPeriod: string;
  eventCount: number;
  planLimit: number;
  pct: number;
}

function UsageCard({ usage }: { usage: UsageData }) {
  const pct = Math.min(usage.pct, 1);
  const over100 = usage.pct >= 1;
  const over80 = usage.pct >= 0.8;

  const barColor = over100
    ? 'bg-rose-500'
    : over80
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <section className="rounded-lg border border-border bg-background p-6">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">
          {usage.billingPeriod} · {usage.plan} plan
        </span>
        <span className="text-sm font-medium">
          {Math.round(usage.pct * 100)}%
        </span>
      </div>

      <div className="mb-2 text-2xl font-semibold">
        {formatNumber(usage.eventCount)}
        <span className="text-base font-normal text-muted-foreground">
          {' '}
          / {formatNumber(usage.planLimit)} events
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>

      {over100 ? (
        <p className="mt-4 rounded-md bg-rose-500/15 px-3 py-2 text-sm text-rose-400">
          You have reached your monthly event limit. New events may be rejected until the next
          billing period or until you upgrade.
        </p>
      ) : over80 ? (
        <p className="mt-4 rounded-md bg-amber-500/15 px-3 py-2 text-sm text-amber-400">
          You have used over 80% of your monthly event limit.
        </p>
      ) : null}
    </section>
  );
}
