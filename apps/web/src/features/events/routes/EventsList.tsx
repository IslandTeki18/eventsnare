import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { usePaginatedQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EventFilters } from '@/features/events/components/EventFilters';

type EventStatus = 'received' | 'delivering' | 'delivered' | 'failed' | 'deadLetter';

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function EventsList() {
  const [searchParams] = useSearchParams();
  const sourceParam = searchParams.get('sourceId');
  const sourceId = sourceParam ? (sourceParam as Id<'sources'>) : undefined;

  const [status, setStatus] = useState<EventStatus>();
  const [term, setTerm] = useState('');
  const [statusCode, setStatusCode] = useState('');

  const debouncedTerm = useDebounced(term.trim(), 300);
  const lastStatusCode = statusCode ? Number(statusCode) : undefined;
  const isSearch = debouncedTerm.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-2 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        <EventFilters
          term={term}
          onTermChange={setTerm}
          status={status}
          onStatusChange={(s) => setStatus(s as EventStatus)}
          statusCode={statusCode}
          onStatusCodeChange={setStatusCode}
        />
      </div>
      <p className="mb-6 text-xs text-muted-foreground">
        Search covers event type, provider event id, and the inline payload prefix. Large payloads
        stored as files are not searched.
      </p>

      {isSearch ? (
        <SearchResults
          term={debouncedTerm}
          sourceId={sourceId}
          status={status}
          lastStatusCode={lastStatusCode}
        />
      ) : (
        <BrowseResults sourceId={sourceId} status={status} lastStatusCode={lastStatusCode} />
      )}
    </div>
  );
}

function BrowseResults({
  sourceId,
  status,
  lastStatusCode,
}: {
  sourceId?: Id<'sources'>;
  status?: EventStatus;
  lastStatusCode?: number;
}) {
  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.events.list,
    { sourceId, status, lastStatusCode },
    { initialNumItems: 25 },
  );
  return <EventTable results={results} pageStatus={pageStatus} loadMore={loadMore} />;
}

function SearchResults({
  term,
  sourceId,
  status,
  lastStatusCode,
}: {
  term: string;
  sourceId?: Id<'sources'>;
  status?: EventStatus;
  lastStatusCode?: number;
}) {
  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.events.search,
    { term, sourceId, status, lastStatusCode },
    { initialNumItems: 25 },
  );
  return <EventTable results={results} pageStatus={pageStatus} loadMore={loadMore} />;
}

type EventRow = {
  _id: Id<'events'>;
  receivedAt: number;
  eventType: string;
  signatureValid: boolean;
  status: EventStatus;
};

function EventTable({
  results,
  pageStatus,
  loadMore,
}: {
  results: EventRow[];
  pageStatus: ReturnType<typeof usePaginatedQuery>['status'];
  loadMore: (n: number) => void;
}) {
  // Selection is per-loaded-page (FR-DASH-4): replay the visible set the user picks.
  const [selected, setSelected] = useState<Set<Id<'events'>>>(new Set());
  const replayBulk = useMutation(api.events.replayBulk);
  const [replaying, setReplaying] = useState(false);

  const toggle = (id: Id<'events'>) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleReplay = async () => {
    setReplaying(true);
    try {
      await replayBulk({ eventIds: [...selected] });
      setSelected(new Set());
    } finally {
      setReplaying(false);
    }
  };

  if (results.length === 0 && pageStatus !== 'LoadingFirstPage') {
    return (
      <div className="rounded-lg border border-border bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">No matching events.</p>
      </div>
    );
  }

  return (
    <>
      {selected.size > 0 ? (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">{selected.size} selected</span>
          <button
            type="button"
            onClick={() => void handleReplay()}
            disabled={replaying}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {replaying ? 'Replaying…' : 'Replay selected'}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-muted-foreground underline hover:text-foreground"
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-2.5" />
              <th className="px-4 py-2.5 font-medium">Received</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Signature</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((event) => (
              <tr key={event._id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(event._id)}
                    onChange={() => toggle(event._id)}
                    aria-label="Select event"
                  />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <Link to={`/events/${event._id}`} className="hover:text-primary">
                    {new Date(event.receivedAt).toLocaleString()}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{event.eventType}</td>
                <td className="px-4 py-3">
                  {event.signatureValid ? (
                    <span className="text-xs text-emerald-400">valid</span>
                  ) : (
                    <span className="text-xs text-rose-400">invalid</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={event.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageStatus === 'CanLoadMore' ? (
        <button
          type="button"
          onClick={() => loadMore(25)}
          className="mt-4 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Load more
        </button>
      ) : null}
    </>
  );
}
