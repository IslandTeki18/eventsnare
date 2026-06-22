import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@clerk/clerk-react';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = '/sign-in',
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
