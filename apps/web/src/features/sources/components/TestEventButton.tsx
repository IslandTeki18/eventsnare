import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

// Send a synthetic event through the real delivery path (SPEC §10 step 6) to verify the
// customer's forward URL is reachable. The resulting event appears in the event list.

interface TestEventButtonProps {
  sourceId: Id<'sources'>;
  onSent?: () => void;
}

export function TestEventButton({ sourceId, onSent }: TestEventButtonProps) {
  const sendTestEvent = useAction(api.sources.sendTestEvent);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleClick = async () => {
    setSending(true);
    try {
      await sendTestEvent({ sourceId });
      setSent(true);
      onSent?.();
      setTimeout(() => setSent(false), 2000);
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={sending}
      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
    >
      {sending ? 'Sending…' : sent ? 'Test sent' : 'Send test event'}
    </button>
  );
}
