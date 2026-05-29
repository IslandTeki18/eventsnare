import { useQuery } from 'convex/react';
import { StatCard } from '@/features/admin-dashboard/components/StatCard';
import { api } from '@convex/_generated/api';

export function AdminOverview() {
  const analytics = useQuery(api.admin.getAnalytics);

  if (analytics === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (analytics === null) {
    return <p className="text-sm text-muted-foreground">Forbidden.</p>;
  }

  const roleEntries = Object.entries(analytics.roleDistribution as Record<string, number>);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total users" value={analytics.totalUsers} />
        <StatCard
          title="Signups (7d)"
          value={analytics.signupsLast7Days}
          caption="Created within the last 7 days"
        />
        <StatCard
          title="Distinct roles"
          value={roleEntries.length}
          caption={roleEntries.length === 0 ? 'No roles seeded yet' : 'across all assignments'}
        />
      </div>
      <section className="rounded-lg border border-border bg-background p-5">
        <h2 className="mb-3 text-base font-semibold">Role distribution</h2>
        {roleEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No roles have been assigned. Seed defaults via the Convex dashboard.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {roleEntries.map(([role, count]) => (
              <li
                key={role}
                className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-sm"
              >
                <span className="font-medium">{role}</span>
                <span className="text-muted-foreground">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
