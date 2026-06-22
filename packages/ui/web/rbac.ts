import { useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';

const getMyRolesRef = makeFunctionReference<'query'>('rbac:getMyRoles');

interface MyRoles {
  roles: string[];
  permissions: string[];
}

function useMyRoles(): { isLoading: boolean; data: MyRoles } {
  const data = useQuery(getMyRolesRef) as MyRoles | undefined;
  return {
    isLoading: data === undefined,
    data: data ?? { roles: [], permissions: [] },
  };
}

interface UseHasRoleResult<R extends string = string> {
  isLoading: boolean;
  roles: string[];
  hasRole: (role: R) => boolean;
  hasAnyRole: (roles: R[]) => boolean;
}

export function useHasRole<R extends string = string>(): UseHasRoleResult<R> {
  const { isLoading, data } = useMyRoles();
  const roles = data.roles;
  return {
    isLoading,
    roles,
    hasRole: (role) => roles.includes(role),
    hasAnyRole: (target) => target.some((r) => roles.includes(r)),
  };
}

interface UseHasPermissionResult<P extends string = string> {
  isLoading: boolean;
  permissions: string[];
  hasPermission: (permission: P) => boolean;
  hasAnyPermission: (permissions: P[]) => boolean;
}

export function useHasPermission<P extends string = string>(): UseHasPermissionResult<P> {
  const { isLoading, data } = useMyRoles();
  const permissions = data.permissions;
  return {
    isLoading,
    permissions,
    hasPermission: (perm) => permissions.includes(perm),
    hasAnyPermission: (target) => target.some((p) => permissions.includes(p)),
  };
}
