import type { ReactNode } from 'react';
import { useHasRole } from '@eventsnare/ui/web';
import type { Role } from '@/features/rbac/lib/permissions';

interface RequireRoleProps {
  children: ReactNode;
  roles: Role[];
  fallback?: ReactNode;
}

export function RequireRole({ children, roles, fallback = null }: RequireRoleProps) {
  const { isLoading, hasAnyRole } = useHasRole();
  if (isLoading) return null;
  if (!hasAnyRole(roles)) return <>{fallback}</>;
  return <>{children}</>;
}
