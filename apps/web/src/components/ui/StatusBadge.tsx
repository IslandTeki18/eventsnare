import { cn } from '@/lib/utils';

// Status marker for events (received | delivering | delivered | failed | deadLetter) and
// sources (active | paused | deleted): a square dot plus the plain-language label, tinted by
// severity. Unknown statuses fall back to neutral ink.

const COLORS: Record<string, string> = {
  delivered: 'text-ok',
  active: 'text-ok',
  received: 'text-info',
  delivering: 'text-info',
  failed: 'text-warn',
  paused: 'text-warn',
  deadLetter: 'text-bad',
  deleted: 'text-subtle',
};

const LABELS: Record<string, string> = {
  delivered: 'Delivered',
  active: 'Active',
  received: 'Received',
  delivering: 'Sending',
  failed: 'Retrying',
  paused: 'Paused',
  deadLetter: 'Gave up',
  deleted: 'Deleted',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[7px] whitespace-nowrap text-sm',
        COLORS[status] ?? 'text-subtle',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 flex-shrink-0 bg-current" />
      {LABELS[status] ?? status}
    </span>
  );
}
