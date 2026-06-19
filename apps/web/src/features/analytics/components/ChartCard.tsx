import type { ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

// Titled chart card with a fixed-height responsive plot area. Centralizes the card chrome and
// empty state so individual charts only declare their series.
export function ChartCard({
  title,
  subtitle,
  isEmpty,
  height = 220,
  children,
}: {
  title: string;
  subtitle?: string;
  isEmpty?: boolean;
  height?: number;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      <div className="mb-4">
        <h2 className="text-sm font-medium">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {isEmpty ? (
        <div
          className="flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No data in this range.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {children as React.ReactElement}
        </ResponsiveContainer>
      )}
    </section>
  );
}
