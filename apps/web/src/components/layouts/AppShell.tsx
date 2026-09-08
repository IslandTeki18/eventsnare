import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layouts/Sidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}

// Screens redesigned for the new shell own their scroll region (a fixed PageHeader over a
// scrolling body). Screens still on the old full-page layout get one from this wrapper.
export function Scrollable({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-y-auto">{children}</div>;
}
