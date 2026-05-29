import type { ReactNode } from 'react';
import { AdminSidebar } from '@/features/admin-dashboard/components/AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
    </div>
  );
}
