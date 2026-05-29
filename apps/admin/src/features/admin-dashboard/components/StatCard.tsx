import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: ReactNode;
  caption?: string;
}

export function StatCard({ title, value, caption }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      {caption ? <p className="mt-1 text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
