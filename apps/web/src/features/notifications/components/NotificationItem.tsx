import type { MouseEventHandler } from 'react';

interface NotificationItemProps {
  title: string;
  body?: string;
  createdAt: number;
  unread: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

function relativeTime(ms: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationItem({ title, body, createdAt, unread, onClick }: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted ${unread ? 'bg-muted/40' : ''}`}
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? 'bg-foreground' : 'bg-transparent'}`}
        aria-hidden
      />
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {body ? <span className="text-xs text-muted-foreground">{body}</span> : null}
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
          {relativeTime(createdAt)}
        </span>
      </span>
    </button>
  );
}
