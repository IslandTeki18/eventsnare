import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/Button';

// One-click replay (SPEC FR-DASH-3): resets the event's delivery lifecycle and schedules an
// immediate attempt. The event row updates reactively.

interface ReplayButtonProps {
  eventId: Id<'events'>;
}

export function ReplayButton({ eventId }: ReplayButtonProps) {
  const replay = useMutation(api.events.replay);
  const [replaying, setReplaying] = useState(false);

  const handleClick = async () => {
    setReplaying(true);
    try {
      await replay({ eventId });
    } finally {
      setReplaying(false);
    }
  };

  return (
    <Button variant="primary" onClick={() => void handleClick()} disabled={replaying}>
      {replaying ? 'Sending…' : 'Send again'}
    </Button>
  );
}
