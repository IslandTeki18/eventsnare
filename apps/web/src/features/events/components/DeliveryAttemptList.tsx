import type { Doc } from '@convex/_generated/dataModel';

// Per-attempt delivery history for an event (SPEC FR-DASH-2): status code or error and the
// truncated customer response body.

interface DeliveryAttemptListProps {
  attempts: Doc<'deliveryAttempts'>[];
}

function statusColor(code?: number): string {
  if (code === undefined) return 'text-rose-400';
  if (code >= 200 && code < 300) return 'text-emerald-400';
  return 'text-amber-400';
}

export function DeliveryAttemptList({ attempts }: DeliveryAttemptListProps) {
  if (attempts.length === 0) {
    return <p className="text-sm text-muted-foreground">No delivery attempts yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {attempts.map((attempt) => (
        <li
          key={attempt._id}
          className="rounded-md border border-border bg-background p-3 text-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">Attempt {attempt.attemptNumber}</span>
            <span className={statusColor(attempt.statusCode)}>
              {attempt.statusCode ?? 'error'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(attempt.startedAt).toLocaleString()}
          </p>
          {attempt.errorMessage ? (
            <p className="mt-1 text-xs text-rose-400">{attempt.errorMessage}</p>
          ) : null}
          {attempt.responseBodyTruncated ? (
            <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 font-mono text-xs text-muted-foreground">
              {attempt.responseBodyTruncated}
            </pre>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
