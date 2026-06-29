import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useToast } from '@/components/ui/Toast';

// Auto-pops a toast when a new in-app notification arrives. Seeds the latest-seen id on first
// load so the existing backlog is not re-toasted on every page open.
export function NotificationToaster() {
  const recent = useQuery(api.notifications.listMyRecent, { limit: 1 });
  const { toast } = useToast();
  const seenId = useRef<string | null>(null);

  useEffect(() => {
    if (recent === undefined) return;
    const latest = recent[0] as
      | { _id: string; title: string; body?: string }
      | undefined;
    if (!latest) return;
    if (seenId.current === null) {
      seenId.current = latest._id;
      return;
    }
    if (latest._id !== seenId.current) {
      seenId.current = latest._id;
      toast({ title: latest.title, body: latest.body });
    }
  }, [recent, toast]);

  return null;
}
