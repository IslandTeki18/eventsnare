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
        className="fixed right-4 top-4 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {badgeText ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {badgeText}
          </span>
        ) : null}
      </button>
      {open ? <NotificationPanel onClose={() => setOpen(false)} /> : null}
    </>
  );
}
