// Status filter for the event list (SPEC FR-DASH-1). Source/type/date filters can be added
// here later; status is the highest-value filter for the MVP.

const STATUSES = ['received', 'delivering', 'delivered', 'failed', 'deadLetter'] as const;

const LABELS: Record<string, string> = { deadLetter: 'dead-letter' };

interface EventFiltersProps {
  status?: string;
  onStatusChange: (status?: string) => void;
}

export function EventFilters({ status, onStatusChange }: EventFiltersProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <FilterChip active={!status} onClick={() => onStatusChange(undefined)} label="All" />
      {STATUSES.map((s) => (
        <FilterChip
          key={s}
          active={status === s}
          onClick={() => onStatusChange(s)}
          label={LABELS[s] ?? s}
        />
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'
          : 'rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted'
      }
    >
      {label}
    </button>
  );
}
