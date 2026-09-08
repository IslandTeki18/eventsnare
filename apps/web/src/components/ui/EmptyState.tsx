import type { ReactNode } from 'react';

// Centred empty / error block used inside a scroll region. `tone="bad"` marks the failure
// variant, which pairs the heading with a status dot and can carry a support reference.

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  tone?: 'default' | 'bad';
  reference?: string;
  children?: ReactNode;
}

export function EmptyState({
  title,
  description,
  tone = 'default',
  reference,
  children,
}: EmptyStateProps) {
  return (
    <div className="px-6 py-12 text-center">
      {tone === 'bad' ? (
        <div className="inline-flex items-center gap-2 text-lg font-semibold text-bad">
          <span className="h-[7px] w-[7px] bg-bad" />
          {title}
        </div>
      ) : (
        <div className="text-lg font-semibold">{title}</div>
      )}
      {description ? (
        <p className="mx-auto mt-2 max-w-[420px] text-sm leading-[19px] text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-4 flex justify-center gap-2">{children}</div> : null}
      {reference ? <p className="mt-3.5 font-mono text-2xs text-subtle">{reference}</p> : null}
    </div>
  );
}
