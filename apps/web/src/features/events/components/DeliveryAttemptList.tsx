import type { Doc } from '@convex/_generated/dataModel';

// Per-attempt delivery history for an event (SPEC FR-DASH-2): status code or error and the
// truncated customer response body, as one hairline-divided row per attempt.

interface DeliveryAttemptListProps {
  attempts: Doc<'deliveryAttempts'>[];
}

function tone(code?: number): string {
  if (code === undefined) return 'text-bad';
  if (code >= 200 && code < 300) return 'text-ok';
  if (code >= 500) return 'text-bad';
  return 'text-warn';
}

function summarize(attempt: Doc<'deliveryAttempts'>): string {
  const at = new Date(attempt.startedAt).toLocaleTimeString();
  const ms =
    attempt.completedAt === undefined ? null : attempt.completedAt - attempt.startedAt;
  const took = ms === null ? null : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  return [at, took ? `took ${took}` : null, attempt.errorMessage].filter(Boolean).join(' · ');
}

export function DeliveryAttemptList({ attempts }: DeliveryAttemptListProps) {
  if (attempts.length === 0) {
    return <p className="px-5 py-[15px] text-xs text-subtle">No delivery attempts yet.</p>;
  }

  return (
    <>
      {attempts.map((attempt) => (
        <div key={attempt._id} className="border-b border-border-soft px-5 py-[15px]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm">
              <span className={`h-1.5 w-1.5 bg-current ${tone(attempt.statusCode)}`} />
              Attempt {attempt.attemptNumber}
            </span>
            <span className={`font-mono text-sm tabular-nums ${tone(attempt.statusCode)}`}>
              {attempt.statusCode ?? 'error'}
            </span>
          </div>
          <div className="mt-1 text-xs text-subtle">{summarize(attempt)}</div>
          {attempt.responseBodyTruncated ? (
            <pre className="m-0 mt-2.5 overflow-x-auto rounded-md border border-border bg-panel px-2.5 py-2 font-mono text-xs leading-4 text-muted-foreground">
              {attempt.responseBodyTruncated}
            </pre>
          ) : null}
        </div>
      ))}
    </>
  );
}
