import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Role } from '@/features/rbac/lib/permissions';

interface UseHasRoleResult {
  isLoading: boolean;
  roles: string[];
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
}

export function useHasRole(): UseHasRoleResult {
  const data = useQuery(api.rbac.getMyRoles);
  const isLoading = data === undefined;
  const roles = data?.roles ?? [];
  return {
    isLoading,
    roles,
    hasRole: (role) => roles.includes(role),
    hasAnyRole: (target) => target.some((r) => roles.includes(r)),
  };
}
