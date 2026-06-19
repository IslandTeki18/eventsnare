import { RANGE_OPTIONS, type RangeKey } from '@/features/analytics/lib/timeRange';

export function TimeRangePicker({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (key: RangeKey) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={
            value === opt.key
              ? 'rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'
              : 'rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted'
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
