interface PlanCardProps {
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year' | 'one-time';
  features: string[];
  isCurrent?: boolean;
  onSubscribe: () => void;
}

function formatPrice(cents: number, currency: string): string {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function PlanCard({
  name,
  description,
  priceCents,
  currency,
  interval,
  features,
  isCurrent,
  onSubscribe,
}: PlanCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-background p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="mb-4 flex items-baseline gap-1">
        <span className="text-3xl font-semibold">{formatPrice(priceCents, currency)}</span>
        <span className="text-sm text-muted-foreground">
          /{interval === 'one-time' ? 'once' : interval}
        </span>
      </div>
      <ul className="mb-6 flex flex-1 flex-col gap-1 text-sm text-muted-foreground">
        {features.map((feature) => (
          <li key={feature}>• {feature}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSubscribe}
        disabled={isCurrent}
        className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-colors disabled:opacity-60"
      >
        {isCurrent ? 'Current plan' : 'Subscribe'}
      </button>
    </div>
  );
}
