// Layout for authenticated product routes: auth gate -> app shell (sidebar) -> ensured
// workspace context. Wrap every sources/events/dashboard route element in this.

import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/features/auth';
import { AppShell } from '@/components/layouts/AppShell';
import { WorkspaceProvider } from '@/features/workspace/context';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <AppShell>{children}</AppShell>
      </WorkspaceProvider>
    </ProtectedRoute>
  );
}
