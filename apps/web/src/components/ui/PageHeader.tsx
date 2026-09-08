import type { ReactNode } from 'react';

// The 48px bar every screen sits under: title or breadcrumb on the left, actions on the right.

interface PageHeaderProps {
  title: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex h-12 flex-shrink-0 items-center justify-between gap-4 border-b border-border px-[22px]">
      <span className="min-w-0 truncate text-base font-medium">{title}</span>
      {children ? <div className="flex flex-shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
