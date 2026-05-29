import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/features/auth';
import { useHasRole } from '@/features/rbac';
import { useSignOut } from '@/features/auth';

interface AdminGateProps {
  children: ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  return (
    <ProtectedRoute>
      <RoleCheck>{children}</RoleCheck>
    </ProtectedRoute>
  );
}

function RoleCheck({ children }: { children: ReactNode }) {
  const { isLoading, hasRole } = useHasRole();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!hasRole('admin')) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

function AccessDenied() {
  const signOut = useSignOut();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have admin access to Eventsnare.
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-5 inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
