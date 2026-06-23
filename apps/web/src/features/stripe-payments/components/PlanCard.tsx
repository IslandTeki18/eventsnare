import {
  type PlanInterval,
  type PlanTier,
  annualMonthlyCents,
  formatEvents,
  formatPrice,
} from '@/features/stripe-payments/lib/catalog';

interface PlanCardProps {
  plan: PlanTier;
  interval: PlanInterval;
  isCurrent: boolean;
  actionLabel: string;
  actionDisabled: boolean;
  onAction: () => void;
}

export function PlanCard({
  plan,
  interval,
  isCurrent,
  actionLabel,
  actionDisabled,
  onAction,
}: PlanCardProps) {
  const isFree = plan.monthlyCents === 0;
  const displayCents =
    interval === 'year' ? annualMonthlyCents(plan.monthlyCents) : plan.monthlyCents;

  return (
    <div
      className={`relative flex flex-col rounded-lg border bg-background p-6 ${
        plan.popular ? 'border-foreground' : 'border-border'
      }`}
    >
      {plan.popular ? (
        <span className="absolute -top-2 left-6 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase text-background">
          Most popular
        </span>
      ) : null}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
      </div>
      <div className="mb-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold">{formatPrice(displayCents)}</span>
        {!isFree ? <span className="text-sm text-muted-foreground">/mo</span> : null}
      </div>
      <p className="mb-4 h-4 text-xs text-muted-foreground">
        {!isFree && interval === 'year' ? 'billed annually' : ' '}
      </p>
      <ul className="mb-6 flex flex-1 flex-col gap-1 text-sm text-muted-foreground">
        <li>• {formatEvents(plan.eventsPerMonth)} events/mo</li>
        <li>• {plan.sources === null ? 'Unlimited' : plan.sources} sources</li>
        <li>• {plan.retentionDays}-day retention</li>
        {plan.features.map((feature) => (
          <li key={feature}>• {feature}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled || isCurrent}
        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
          isCurrent
            ? 'border border-border bg-background'
            : 'bg-foreground text-background'
        }`}
      >
        {isCurrent ? 'Current plan' : actionLabel}
      </button>
    </div>
  );
}
