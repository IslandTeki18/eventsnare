import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { NotificationPanel } from '@/features/notifications/components/NotificationPanel';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unreadCount = useQuery(api.notifications.getMyUnreadCount);
  const badgeText = typeof unreadCount === 'number' && unreadCount > 0
    ? unreadCount > 99 ? '99+' : String(unreadCount)
    : null;

  return (
    <>
      <button
        type="button"
        aria-label={`Notifications${badgeText ? ` (${badgeText} unread)` : ''}`}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-[27px] w-[27px] flex-shrink-0 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {badgeText ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-bad px-1 text-3xs font-semibold text-background">
            {badgeText}
          </span>
        ) : null}
      </button>
      {open ? <NotificationPanel onClose={() => setOpen(false)} /> : null}
    </>
  );
}
