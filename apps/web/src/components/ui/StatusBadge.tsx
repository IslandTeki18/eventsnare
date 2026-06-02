import { cn } from '@/lib/utils';

// Shared status pill for both event statuses (received | delivering | delivered | failed |
// deadLetter) and source statuses (active | paused | deleted). Unknown statuses fall back to
// a neutral style.

const STYLES: Record<string, string> = {
  delivered: 'bg-emerald-500/15 text-emerald-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  received: 'bg-sky-500/15 text-sky-400',
  delivering: 'bg-sky-500/15 text-sky-400',
  failed: 'bg-amber-500/15 text-amber-400',
  paused: 'bg-amber-500/15 text-amber-400',
  deadLetter: 'bg-rose-500/15 text-rose-400',
  deleted: 'bg-muted text-muted-foreground',
};

const LABELS: Record<string, string> = {
  deadLetter: 'dead-letter',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        STYLES[status] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
