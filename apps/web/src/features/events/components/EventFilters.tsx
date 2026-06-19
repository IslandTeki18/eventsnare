// Event list filters (SPEC FR-DASH-1, P4 search). A free-text search box over the event search
// index (metadata + inline-body prefix), status chips, and a delivery status-code filter. The
// parent owns state and debouncing; this component is presentational.

const STATUSES = ['received', 'delivering', 'delivered', 'failed', 'deadLetter'] as const;

const LABELS: Record<string, string> = { deadLetter: 'dead-letter' };

interface EventFiltersProps {
  term: string;
  onTermChange: (term: string) => void;
  status?: string;
  onStatusChange: (status?: string) => void;
  statusCode: string;
  onStatusCodeChange: (code: string) => void;
}

export function EventFilters({
  term,
  onTermChange,
  status,
  onStatusChange,
  statusCode,
  onStatusCodeChange,
}: EventFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={term}
          onChange={(e) => onTermChange(e.target.value)}
          placeholder="Search event type, id, or payload…"
          className="w-72 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <input
          value={statusCode}
          onChange={(e) => onStatusCodeChange(e.target.value.replace(/[^0-9]/g, ''))}
          inputMode="numeric"
          placeholder="Status code"
          className="w-28 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>
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
