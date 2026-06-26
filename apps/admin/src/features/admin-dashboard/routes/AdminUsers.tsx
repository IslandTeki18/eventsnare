import { useQuery } from 'convex/react';
import { DataTable } from '@/components/DataTable';
import { LoadingState } from '@/components/LoadingState';
import { UserRoleCell } from '@/features/admin-dashboard/components/UserRoleCell';
import { api } from '@convex/_generated/api';

interface UserRow {
  user: {
    _id: string;
    clerkId: string;
    email: string;
    name?: string;
    imageUrl?: string;
  };
  roles: string[];
}

export function AdminUsers() {
  const users = useQuery(api.admin.listUsersWithRoles);

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
          columns={[{ label: 'User' }, { label: 'Roles' }]}
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
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
