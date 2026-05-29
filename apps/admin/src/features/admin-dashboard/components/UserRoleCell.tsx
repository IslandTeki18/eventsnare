import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

const KNOWN_ROLES = ['admin', 'member', 'viewer'] as const;

interface UserRoleCellProps {
  userId: string;
  roles: string[];
}

export function UserRoleCell({ userId, roles }: UserRoleCellProps) {
  const setUserRole = useMutation(api.admin.setUserRole);
  const unsetUserRole = useMutation(api.admin.unsetUserRole);

  const handleToggle = async (roleName: string, checked: boolean) => {
    if (checked) {
      await setUserRole({ userId: userId as Id<'users'>, roleName });
    } else {
      await unsetUserRole({ userId: userId as Id<'users'>, roleName });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {KNOWN_ROLES.map((role) => {
        const checked = roles.includes(role);
        return (
          <label
            key={role}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors ${checked ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-muted-foreground hover:bg-muted'}`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => void handleToggle(role, event.target.checked)}
              className="hidden"
            />
            {role}
          </label>
        );
      })}
    </div>
  );
}
