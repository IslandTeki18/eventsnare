import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

export function useNotifications(limit?: number) {
  const recent = useQuery(api.notifications.listMyRecent, limit !== undefined ? { limit } : {});
  const unreadCount = useQuery(api.notifications.getMyUnreadCount);
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  return {
    isLoading: recent === undefined || unreadCount === undefined,
    recent: recent ?? [],
    unreadCount: unreadCount ?? 0,
    markRead,
    markAllRead,
  };
}
