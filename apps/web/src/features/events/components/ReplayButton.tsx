import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

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
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={replaying}
      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
    >
      {replaying ? 'Replaying…' : 'Replay'}
    </button>
  );
}
