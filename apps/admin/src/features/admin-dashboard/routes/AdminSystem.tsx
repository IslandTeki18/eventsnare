import { useQuery } from 'convex/react';
import { StatCard } from '@/features/admin-dashboard/components/StatCard';
import { api } from '@convex/_generated/api';

function formatTimestamp(ms: number): string {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return '';
  }
}

export function AdminSystem() {
  const status = useQuery(api.admin.getSystemStatus);

  if (status === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (status === null) {
    return <p className="text-sm text-muted-foreground">Forbidden.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">System</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Uptime" value={status.uptime} caption="Convex backend reachable" />
        <StatCard
          title="Convex deployment"
          value={
            <span className="font-mono text-base break-all">
              {status.convexDeploymentUrl}
            </span>
          }
        />
        <StatCard
          title="Last checked"
          value={<span className="text-base">{formatTimestamp(status.checkedAt)}</span>}
        />
      </div>
    </div>
  );
}
