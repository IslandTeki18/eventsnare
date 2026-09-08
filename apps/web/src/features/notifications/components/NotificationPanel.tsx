import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { NotificationItem } from '@/features/notifications/components/NotificationItem';

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const recent = useQuery(api.notifications.listMyRecent, {});
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const hasAny = (recent?.length ?? 0) > 0;
  const hasUnread = recent?.some((n: { readAt?: number }) => n.readAt === undefined) ?? false;

  return (
    <div className="fixed bottom-4 left-[236px] z-40 flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg">
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm font-semibold">Notifications</span>
        <div className="flex items-center gap-2">
          {hasUnread ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        {recent === undefined ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">Loading…</p>
        ) : !hasAny ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
        ) : (
          recent.map((n: { _id: string; title: string; body?: string; createdAt: number; readAt?: number }) => (
            <NotificationItem
              key={n._id}
              title={n.title}
              body={n.body}
              createdAt={n.createdAt}
              unread={n.readAt === undefined}
              onClick={() => void markRead({ notificationId: n._id as any })}
            />
          ))
        )}
      </div>
    </div>
  );
}
