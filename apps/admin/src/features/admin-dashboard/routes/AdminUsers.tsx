import { useState } from 'react';
import { useAction, useQuery } from 'convex/react';
import { DataTable } from '@/components/DataTable';
import { LoadingState } from '@/components/LoadingState';
import { UserRoleCell } from '@/features/admin-dashboard/components/UserRoleCell';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

interface UserRow {
  user: {
    _id: string;
    clerkId: string;
    email: string;
    name?: string;
    imageUrl?: string;
  };
  roles: string[];
  isBanned: boolean;
  bannedAt: number | null;
}

export function AdminUsers() {
  const users = useQuery(api.admin.listUsersWithRoles);
  const setUserBanned = useAction(api.adminActions.setUserBanned);
  const [pending, setPending] = useState<string | null>(null);

  const handleToggleBan = async (userId: string, banned: boolean) => {
    setPending(userId);
    try {
      await setUserBanned({ userId: userId as Id<'users'>, banned });
    } finally {
      setPending(null);
    }
  };

  if (users === undefined) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found, or access denied.</p>
      ) : (
        <DataTable
          columns={[
            { label: 'User' },
            { label: 'Roles' },
            { label: 'Status' },
            { label: 'Actions', align: 'right' },
          ]}
        >
          {(users as UserRow[]).map((row) => {
                const displayName = row.user.name ?? row.user.email;
                return (
                  <tr key={row.user._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {row.user.imageUrl ? (
                          <img
                            src={row.user.imageUrl}
                            alt={displayName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                            {displayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{displayName}</p>
                          <p className="truncate text-xs text-muted-foreground">{row.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <UserRoleCell userId={row.user._id} roles={row.roles} />
                    </td>
                    <td className="px-4 py-3">
                      {row.isBanned ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-900">
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-900">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleToggleBan(row.user._id, !row.isBanned)}
                        disabled={pending === row.user._id}
                        className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-60"
                      >
                        {pending === row.user._id
                          ? 'Working…'
                          : row.isBanned
                            ? 'Unban'
                            : 'Ban'}
                      </button>
                    </td>
                  </tr>
                );
              })}
        </DataTable>
      )}
    </div>
  );
}
