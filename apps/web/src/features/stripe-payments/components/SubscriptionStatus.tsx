interface SubscriptionStatusProps {
  planName: string | null;
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString();
  } catch {
    return '—';
  }
}

export function SubscriptionStatus({
  planName,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: SubscriptionStatusProps) {
  const statusColor = status === 'active' || status === 'trialing'
    ? 'bg-emerald-100 text-emerald-900'
    : status === 'past_due' || status === 'unpaid'
      ? 'bg-amber-100 text-amber-900'
      : 'bg-slate-100 text-slate-900';

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-lg font-semibold">{planName ?? 'No active plan'}</h2>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusColor}`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on {formatDate(currentPeriodEnd)}
      </p>
    </div>
  );
}
