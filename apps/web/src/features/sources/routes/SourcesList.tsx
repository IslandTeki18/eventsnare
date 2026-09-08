import { Link } from 'react-router';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { statusRail } from '@/lib/status';
import { getProviderMeta } from '@/features/sources/lib/providers';

const HEAD_CELL =
  'whitespace-nowrap border-b border-border px-3 py-2 text-2xs font-medium text-subtle';
const CELL = 'border-b border-border-soft px-3 py-2 text-sm';

export function SourcesList() {
  const sources = useQuery(api.sources.list);

  return (
    <>
      <PageHeader title="Sources">
        <Link to="/sources/new">
          <Button variant="primary">Add source</Button>
        </Link>
      </PageHeader>

      {sources === undefined ? (
        <p className="px-[22px] py-4 text-sm text-subtle">Loading…</p>
      ) : sources.length === 0 ? (
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
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={`${HEAD_CELL} pl-[22px]`}>Status</th>
                <th className={HEAD_CELL}>Name</th>
                <th className={HEAD_CELL}>Provider</th>
                <th className={`${HEAD_CELL} pr-[22px]`}>Sends to</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source._id} className="hover:bg-muted">
                  <td
                    className={`${CELL} whitespace-nowrap pl-[22px]`}
                    style={statusRail(source.status)}
                  >
                    <StatusBadge status={source.status} />
                  </td>
                  <td className={`${CELL} whitespace-nowrap font-medium`}>
                    <Link to={`/sources/${source._id}`}>{source.name}</Link>
                  </td>
                  <td className={`${CELL} whitespace-nowrap text-muted-foreground`}>
                    {getProviderMeta(source.provider)?.name ?? source.provider}
                  </td>
                  <td
                    className={`${CELL} max-w-[260px] truncate whitespace-nowrap pr-[22px] font-mono text-xs text-muted-foreground`}
                  >
                    {source.forwardUrl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-[22px] py-3 text-sm text-subtle">
            Every source verifies the provider&rsquo;s signature before anything is forwarded.
          </p>
        </div>
      )}
    </>
  );
}
