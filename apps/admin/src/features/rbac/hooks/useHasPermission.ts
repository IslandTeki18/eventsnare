import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Permission } from '@/features/rbac/lib/permissions';

interface UseHasPermissionResult {
  isLoading: boolean;
  permissions: string[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
}

export function useHasPermission(): UseHasPermissionResult {
  const data = useQuery(api.rbac.getMyRoles);
  const isLoading = data === undefined;
  const permissions = data?.permissions ?? [];
  return {
    isLoading,
    permissions,
    hasPermission: (perm) => permissions.includes(perm),
    hasAnyPermission: (target) => target.some((p) => permissions.includes(p)),
  };
}
