import { Link } from 'react-router';
import { useQuery, usePaginatedQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useWorkspace } from '@/features/workspace/workspaceContext';

// Dashboard overview. Brand-new users (no sources) are routed to onboarding; otherwise show
// source count and recent event activity.

export function Home() {
  const workspace = useWorkspace();
  const sources = useQuery(api.sources.list);
  const { results: recent } = usePaginatedQuery(api.events.list, {}, { initialNumItems: 10 });

  if (sources !== undefined && sources.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to Eventsnare</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect your first webhook provider to start capturing events.
        </p>
        <Link
          to="/onboarding"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{workspace.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Plan: {workspace.plan} · {sources?.length ?? 0} source
        {sources?.length === 1 ? '' : 's'}
      </p>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent events</h2>
          <Link to="/events" className="text-xs text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground">
            No events yet.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {recent.map((event) => (
              <li
                key={event._id}
                className="flex items-center justify-between border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-muted/30"
              >
                <Link to={`/events/${event._id}`} className="font-mono text-xs hover:text-primary">
                  {event.eventType}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.receivedAt).toLocaleTimeString()}
                  </span>
                  <StatusBadge status={event.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
