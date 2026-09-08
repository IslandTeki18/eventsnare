import { Link, useParams } from 'react-router';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
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
    return <p className="px-[22px] py-4 text-sm text-subtle">Loading…</p>;
  }
  if (data === null) {
    return <p className="px-[22px] py-4 text-sm text-subtle">Event not found.</p>;
  }

  const { event, attempts, payloadInline, payloadUrl } = data;
  const lastCode = attempts.at(-1)?.statusCode;

  return (
    <>
      <PageHeader
        title={
          <>
            <Link to="/events" className="text-subtle">
              Events
            </Link>
            <span className="text-subtle"> / </span>
            <span className="font-mono text-sm font-medium">{event.eventType}</span>
          </>
        }
      >
        <Button onClick={() => void navigator.clipboard?.writeText(event.providerEventId)}>
          Copy ID
        </Button>
        <ReplayButton eventId={id} />
      </PageHeader>

      <div className="flex flex-1 flex-wrap items-stretch overflow-y-auto">
        <div className="min-w-0 flex-1 basis-[420px]">
          <div className="border-b border-border px-[22px] pb-[18px] pt-5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="m-0 font-mono text-xl font-medium tracking-[-0.01em]">
                {event.eventType}
              </h1>
              <StatusBadge status={event.status} />
            </div>
            <p className="mt-[7px] font-mono text-xs text-subtle">{event.providerEventId}</p>
          </div>

          <div
            className="grid border-b border-border"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))' }}
          >
            <Meta label="Arrived" value={new Date(event.receivedAt).toLocaleString()} />
            <Meta
              label="Signature"
              value={event.signatureValid ? 'Verified' : 'Not verified'}
              tone={event.signatureValid ? undefined : 'text-bad'}
            />
            <Meta label="Attempts" value={String(event.attemptCount)} />
            <Meta
              label="Your endpoint replied"
              value={lastCode === undefined ? '—' : String(lastCode)}
              mono
              tone={
                lastCode === undefined
                  ? 'text-subtle'
                  : lastCode >= 200 && lastCode < 300
                    ? 'text-ok'
                    : lastCode >= 500
                      ? 'text-bad'
                      : 'text-warn'
              }
            />
            {event.deadLetterAt ? (
              <Meta
                label="Gave up"
                value={new Date(event.deadLetterAt).toLocaleString()}
                tone="text-bad"
              />
            ) : null}
          </div>

          <div className="px-[22px] pb-6 pt-[18px]">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">What the provider sent</span>
              {payloadInline ? (
                <Button
                  size="sm"
                  onClick={() => void navigator.clipboard?.writeText(payloadInline)}
                >
                  Copy
                </Button>
              ) : null}
            </div>
            {payloadInline ? (
              <pre className="m-0 max-h-[340px] overflow-auto rounded-lg border border-border bg-panel px-3.5 py-3 font-mono text-xs leading-[19px]">
                {prettyJson(payloadInline)}
              </pre>
            ) : payloadUrl ? (
              <a
                href={payloadUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Download payload (stored in file storage)
              </a>
            ) : (
              <p className="text-sm text-subtle">No payload stored.</p>
            )}
          </div>
        </div>

        <div className="max-w-[360px] flex-1 basis-[300px] border-l border-border">
          <div className="border-b border-border px-5 py-[15px] text-sm font-medium">
            Delivery attempts
          </div>
          <DeliveryAttemptList attempts={attempts} />
        </div>
      </div>
    </>
  );
}

function Meta({
  label,
  value,
  mono = false,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: string;
}) {
  return (
    <div className="border-l border-border-soft px-[22px] py-3">
      <div className="text-xs text-subtle">{label}</div>
      <div
        className={`mt-1 text-sm tabular-nums ${mono ? 'font-mono' : ''} ${tone ?? 'text-foreground'}`}
      >
        {value}
      </div>
    </div>
  );
}
