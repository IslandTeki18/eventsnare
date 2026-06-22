import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { ProtectedRoute } from '@/features/auth';
import { useHasRole } from '@eventsnare/ui/web';
import type { Role } from '@/features/rbac/lib/permissions';

interface RoleProtectedRouteProps {
  children: ReactNode;
  roles: Role[];
  redirectTo?: string;
  signInRedirect?: string;
}

export function RoleProtectedRoute({
  children,
  roles,
  redirectTo = '/',
  signInRedirect,
}: RoleProtectedRouteProps) {
  return (
    <ProtectedRoute redirectTo={signInRedirect}>
      <RoleGate roles={roles} redirectTo={redirectTo}>
        {children}
      </RoleGate>
    </ProtectedRoute>
  );
}

function RoleGate({
  children,
  roles,
  redirectTo,
}: {
  children: ReactNode;
  roles: Role[];
  redirectTo: string;
}) {
  const { isLoading, hasAnyRole } = useHasRole();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!hasAnyRole(roles)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}
