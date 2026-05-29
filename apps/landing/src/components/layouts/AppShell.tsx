import type { ReactNode } from 'react';
import { Navbar } from '@/components/layouts/Navbar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
