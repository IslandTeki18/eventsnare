import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/Button';

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
    <Button variant="primary" onClick={() => void handleClick()} disabled={sending}>
      {sending ? 'Sending…' : sent ? 'Test sent' : 'Send a test event'}
    </Button>
  );
}
