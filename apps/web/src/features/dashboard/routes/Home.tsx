import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, usePaginatedQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatGrid, type Stat } from '@/components/ui/StatGrid';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { statusRail } from '@/lib/status';
import { DeliveryBars } from '@/features/dashboard/components/DeliveryBars';
import { formatPercent, rangeWindow } from '@/features/analytics/lib/timeRange';
import type { Totals } from '@/features/analytics/lib/types';

const HEALTH_LABEL: Record<string, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  down: 'Down',
  idle: 'Idle',
};

const HEALTH_TONE: Record<string, Stat['tone']> = {
  healthy: 'ok',
  degraded: 'warn',
  down: 'bad',
  idle: 'default',
};

function overviewStats(totals: Totals): Stat[] {
  return [
    {
      label: 'Delivery attempts',
      value: totals.attempts.toLocaleString('en-US'),
      note: 'In the last 24 hours',
    },
    {
      label: 'Delivered successfully',
      value: totals.attempts === 0 ? '—' : formatPercent(totals.successRate),
      note: `${totals.succeeded.toLocaleString('en-US')} of ${totals.attempts.toLocaleString('en-US')}`,
    },
    {
      label: 'Gave up after retries',
      value: totals.deadLettered.toLocaleString('en-US'),
      note: totals.deadLettered === 0 ? 'Nothing dead-lettered' : 'Ran out of retries',
      tone: totals.deadLettered > 0 ? 'bad' : 'default',
    },
    {
      label: 'Your endpoints',
      value: HEALTH_LABEL[totals.health] ?? totals.health,
      note: 'Across all active sources',
      tone: HEALTH_TONE[totals.health] ?? 'default',
    },
  ];
}

export function Home() {
  const [window, setWindow] = useState(() => rangeWindow('24h', Date.now()));
  const sources = useQuery(api.sources.list);
  const overview = useQuery(api.analytics.getWorkspaceOverview, window);
  const { results: recent } = usePaginatedQuery(api.events.list, {}, { initialNumItems: 6 });

  if (sources !== undefined && sources.length === 0) {
    return (
      <>
        <PageHeader title="Overview" />
        <div className="flex flex-1 items-center justify-center overflow-y-auto">
          <EmptyState
            title="No sources yet"
            description="A source connects one service — like Stripe or Shopify — to your own system. Add one and its events will start appearing here."
          >
            <Link to="/onboarding">
              <Button variant="primary">Add your first source</Button>
            </Link>
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Overview">
        <span className="text-sm text-subtle">Last 24 hours</span>
        <Button onClick={() => setWindow(rangeWindow('24h', Date.now()))}>Refresh</Button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto">
        {overview === undefined ? (
          <p className="px-[22px] py-4 text-sm text-subtle">Loading…</p>
        ) : (
          <>
            <StatGrid stats={overviewStats(overview.totals)} />
            <DeliveryBars series={overview.series} />
          </>
        )}

        <div className="flex items-center justify-between px-[22px] pb-2.5 pt-4">
          <span className="text-sm font-medium">Recent events</span>
          <Link to="/events" className="text-sm text-muted-foreground hover:text-foreground">
            View all events
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-[22px] py-4 text-sm text-subtle">No events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="text-2xs font-medium text-subtle">
                  <th className="whitespace-nowrap border-b border-border py-2 pl-[22px] pr-3 font-medium">
                    Status
                  </th>
                  <th className="whitespace-nowrap border-b border-border px-3 py-2 font-medium">
                    Event
                  </th>
                  <th className="whitespace-nowrap border-b border-border px-3 py-2 text-right font-medium">
                    Received
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((event) => (
                  <tr key={event._id} className="cursor-pointer hover:bg-muted">
                    <td
                      className="whitespace-nowrap border-b border-border-soft py-[7px] pl-[22px] pr-3"
                      style={statusRail(event.status)}
                    >
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="whitespace-nowrap border-b border-border-soft px-3 py-[7px] font-mono text-sm">
                      <Link to={`/events/${event._id}`}>{event.eventType}</Link>
                    </td>
                    <td className="whitespace-nowrap border-b border-border-soft py-[7px] pl-3 pr-[22px] text-right text-sm tabular-nums text-muted-foreground">
                      {new Date(event.receivedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="h-6" />
      </div>
    </>
  );
}
