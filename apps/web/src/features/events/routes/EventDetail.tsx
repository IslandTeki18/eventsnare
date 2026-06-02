import { Link, useParams } from 'react-router';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DeliveryAttemptList } from '@/features/events/components/DeliveryAttemptList';
import { ReplayButton } from '@/features/events/components/ReplayButton';

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function EventDetail() {
  const { eventId } = useParams();
  const id = eventId as Id<'events'>;
  const data = useQuery(api.events.get, { eventId: id });

  if (data === undefined) {
    return <p className="px-6 py-10 text-sm text-muted-foreground">Loading…</p>;
  }
  if (data === null) {
    return <p className="px-6 py-10 text-sm text-muted-foreground">Event not found.</p>;
  }

  const { event, attempts, payloadInline, payloadUrl } = data;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/events" className="text-xs text-muted-foreground hover:text-foreground">
        ← Events
      </Link>

      <div className="mb-6 mt-2 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold tracking-tight">{event.eventType}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {event.providerEventId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={event.status} />
          <ReplayButton eventId={id} />
        </div>
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-3 text-sm">
        <Detail label="Received" value={new Date(event.receivedAt).toLocaleString()} />
        <Detail label="Signature" value={event.signatureValid ? 'valid' : 'invalid'} />
        <Detail label="Attempts" value={String(event.attemptCount)} />
        {event.deadLetterAt ? (
          <Detail label="Dead-lettered" value={new Date(event.deadLetterAt).toLocaleString()} />
        ) : null}
      </dl>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-medium">Payload</h2>
        {payloadInline ? (
          <pre className="max-h-80 overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
            {prettyJson(payloadInline)}
          </pre>
        ) : payloadUrl ? (
          <a
            href={payloadUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Download payload (stored in file storage)
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">No payload stored.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Delivery attempts</h2>
        <DeliveryAttemptList attempts={attempts} />
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
