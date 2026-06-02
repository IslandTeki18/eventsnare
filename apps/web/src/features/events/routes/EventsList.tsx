import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { usePaginatedQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EventFilters } from '@/features/events/components/EventFilters';

type EventStatus = 'received' | 'delivering' | 'delivered' | 'failed' | 'deadLetter';

export function EventsList() {
  const [searchParams] = useSearchParams();
  const sourceParam = searchParams.get('sourceId');
  const sourceId = sourceParam ? (sourceParam as Id<'sources'>) : undefined;

  const [status, setStatus] = useState<EventStatus>();

  // Reactive + paginated: new events stream into the list live (FR-DASH-8).
  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.events.list,
    { sourceId, status },
    { initialNumItems: 25 },
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        <EventFilters status={status} onStatusChange={(s) => setStatus(s as EventStatus)} />
      </div>

      {results.length === 0 && pageStatus !== 'LoadingFirstPage' ? (
        <div className="rounded-lg border border-border bg-background p-8 text-center">
          <p className="text-sm text-muted-foreground">No events yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Received</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Signature</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((event) => (
                <tr key={event._id} className="border-t border-border hover:bg-muted/30">
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
      )}

      {pageStatus === 'CanLoadMore' ? (
        <button
          type="button"
          onClick={() => loadMore(25)}
          className="mt-4 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Load more
        </button>
      ) : null}
    </div>
  );
}
