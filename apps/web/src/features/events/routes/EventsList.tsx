import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { usePaginatedQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { statusRail } from '@/lib/status';
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

  const clearFilters = () => {
    setStatus(undefined);
    setTerm('');
    setStatusCode('');
  };

  return (
    <>
      <PageHeader title="Events" />
      <EventFilters
        term={term}
        onTermChange={setTerm}
        status={status}
        onStatusChange={(s) => setStatus(s as EventStatus)}
        statusCode={statusCode}
        onStatusCodeChange={setStatusCode}
      />
      {isSearch ? (
        <SearchResults
          term={debouncedTerm}
          sourceId={sourceId}
          status={status}
          lastStatusCode={lastStatusCode}
          onClearFilters={clearFilters}
        />
      ) : (
        <BrowseResults
          sourceId={sourceId}
          status={status}
          lastStatusCode={lastStatusCode}
          onClearFilters={clearFilters}
        />
      )}
    </>
  );
}

interface ResultsProps {
  sourceId?: Id<'sources'>;
  status?: EventStatus;
  lastStatusCode?: number;
  onClearFilters: () => void;
}

function BrowseResults({ sourceId, status, lastStatusCode, onClearFilters }: ResultsProps) {
  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.events.list,
    { sourceId, status, lastStatusCode },
    { initialNumItems: 25 },
  );
  return (
    <EventTable
      results={results}
      pageStatus={pageStatus}
      loadMore={loadMore}
      onClearFilters={onClearFilters}
    />
  );
}

function SearchResults({
  term,
  sourceId,
  status,
  lastStatusCode,
  onClearFilters,
}: ResultsProps & { term: string }) {
  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.events.search,
    { term, sourceId, status, lastStatusCode },
    { initialNumItems: 25 },
  );
  return (
    <EventTable
      results={results}
      pageStatus={pageStatus}
      loadMore={loadMore}
      onClearFilters={onClearFilters}
    />
  );
}

type EventRow = {
  _id: Id<'events'>;
  receivedAt: number;
  eventType: string;
  signatureValid: boolean;
  status: EventStatus;
  attemptCount: number;
  lastStatusCode?: number;
};

function codeTone(code?: number): string {
  if (code === undefined) return 'text-subtle';
  if (code >= 200 && code < 300) return 'text-ok';
  if (code >= 500) return 'text-bad';
  return 'text-warn';
}

const HEAD_CELL =
  'whitespace-nowrap border-b border-border px-3 py-2 text-2xs font-medium text-subtle';
const CELL = 'border-b border-border-soft px-3 py-[7px] text-sm';

function EventTable({
  results,
  pageStatus,
  loadMore,
  onClearFilters,
}: {
  results: EventRow[];
  pageStatus: ReturnType<typeof usePaginatedQuery>['status'];
  loadMore: (n: number) => void;
  onClearFilters: () => void;
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
      <div className="flex flex-1 items-center justify-center overflow-y-auto">
        <EmptyState
          title="No events match these filters"
          description="Nothing here matches the current search, status, and response code. Try widening the filters."
        >
          <Button onClick={onClearFilters}>Clear filters</Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      {selected.size > 0 ? (
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-border bg-muted px-[22px] py-2 text-sm">
          <span className="text-muted-foreground">{selected.size} selected</span>
          <Button size="sm" onClick={() => void handleReplay()} disabled={replaying}>
            {replaying ? 'Replaying…' : 'Replay selected'}
          </Button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-subtle underline hover:text-foreground"
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className={`${HEAD_CELL} w-px pl-[22px]`}>
                <span className="sr-only">Select</span>
              </th>
              <th className={HEAD_CELL}>Status</th>
              <th className={HEAD_CELL}>Event</th>
              <th className={HEAD_CELL}>Signature</th>
              <th className={`${HEAD_CELL} text-right`}>Attempts</th>
              <th className={`${HEAD_CELL} text-right`}>Response</th>
              <th className={`${HEAD_CELL} pr-[22px] text-right`}>Received</th>
            </tr>
          </thead>
          <tbody>
            {results.map((event) => (
              <tr key={event._id} className="hover:bg-muted">
                <td
                  className={`${CELL} pl-[22px]`}
                  style={statusRail(event.status)}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(event._id)}
                    onChange={() => toggle(event._id)}
                    aria-label="Select event"
                    className="accent-foreground"
                  />
                </td>
                <td className={`${CELL} whitespace-nowrap`}>
                  <StatusBadge status={event.status} />
                </td>
                <td className={`${CELL} whitespace-nowrap font-mono`}>
                  <Link to={`/events/${event._id}`}>{event.eventType}</Link>
                </td>
                <td
                  className={`${CELL} whitespace-nowrap ${
                    event.signatureValid ? 'text-muted-foreground' : 'text-bad'
                  }`}
                >
                  {event.signatureValid ? 'Verified' : 'Not verified'}
                </td>
                <td className={`${CELL} text-right tabular-nums text-muted-foreground`}>
                  {event.attemptCount}
                </td>
                <td
                  className={`${CELL} text-right font-mono tabular-nums ${codeTone(event.lastStatusCode)}`}
                >
                  {event.lastStatusCode ?? '—'}
                </td>
                <td
                  className={`${CELL} whitespace-nowrap pr-[22px] text-right font-mono text-xs tabular-nums text-muted-foreground`}
                >
                  {new Date(event.receivedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-shrink-0 items-center justify-between border-t border-border px-[22px] py-2.5 text-sm text-subtle">
        <span>Showing {results.length.toLocaleString('en-US')}</span>
        {pageStatus === 'CanLoadMore' ? (
          <Button onClick={() => loadMore(25)}>Load more</Button>
        ) : null}
      </div>
    </>
  );
}
