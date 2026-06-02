import { Link } from 'react-router';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getProviderMeta } from '@/features/sources/lib/providers';

export function SourcesList() {
  const sources = useQuery(api.sources.list);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        <Link
          to="/sources/new"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Add source
        </Link>
      </div>

      {sources === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sources.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No sources yet. Connect your first webhook provider to get started.
          </p>
          <Link
            to="/onboarding"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Connect a provider
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Provider</th>
                <th className="px-4 py-2.5 font-medium">Forward URL</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source._id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      to={`/sources/${source._id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {source.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {getProviderMeta(source.provider)?.name ?? source.provider}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                    {source.forwardUrl}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={source.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
