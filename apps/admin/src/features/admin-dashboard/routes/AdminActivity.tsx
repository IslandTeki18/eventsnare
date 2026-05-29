import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

interface ActivityRow {
  _id: string;
  actorUserId: string;
  actorName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: unknown;
  createdAt: number;
}

function formatTimestamp(ms: number): string {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return '';
  }
}

export function AdminActivity() {
  const entries = useQuery(api.admin.listRecentActivity, {});

  if (entries === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
      {entries.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground">
          No activity yet. Activity is recorded when other features call
          {' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">internal.admin.recordActivity</code>.
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {(entries as ActivityRow[]).map((entry) => (
            <li
              key={entry._id}
              className="flex items-start justify-between gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p>
                  <span className="font-medium">{entry.actorName}</span>{' '}
                  <span className="text-muted-foreground">— {entry.action}</span>
                  {entry.targetType && entry.targetId ? (
                    <span className="text-muted-foreground">
                      {' '}on <code className="rounded bg-muted px-1 text-xs">{entry.targetType}:{entry.targetId}</code>
                    </span>
                  ) : null}
                </p>
                {entry.metadata ? (
                  <pre className="mt-1 overflow-hidden rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                    {JSON.stringify(entry.metadata)}
                  </pre>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatTimestamp(entry.createdAt)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
