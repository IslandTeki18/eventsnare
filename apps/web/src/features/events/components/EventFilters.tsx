// Event list filters (SPEC FR-DASH-1, P4 search). A free-text search box over the event search
// index (metadata + inline-body prefix), a delivery status-code filter, and status chips. The
// parent owns state and debouncing; this component is presentational.

import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const STATUSES = ['received', 'delivering', 'delivered', 'failed', 'deadLetter'] as const;

const LABELS: Record<string, string> = {
  received: 'Received',
  delivering: 'Sending',
  delivered: 'Delivered',
  failed: 'Retrying',
  deadLetter: 'Gave up',
};

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
    <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-border px-[22px] py-[11px]">
      <Input
        value={term}
        onChange={(e) => onTermChange(e.target.value)}
        placeholder="Search by event name, ID, or contents"
        className="min-w-[180px] flex-1 basis-[260px]"
      />
      <Input
        value={statusCode}
        onChange={(e) => onStatusCodeChange(e.target.value.replace(/[^0-9]/g, ''))}
        inputMode="numeric"
        placeholder="Response code"
        className="w-[120px]"
      />
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
      className={cn(
        'inline-flex items-center gap-[7px] rounded-sm border px-2.5 py-1 text-sm transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}
