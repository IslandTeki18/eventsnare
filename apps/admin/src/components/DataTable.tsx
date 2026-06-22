import type { ReactNode } from 'react';

export interface Column {
  label: string;
  align?: 'left' | 'right';
}

interface DataTableProps {
  columns: Column[];
  children: ReactNode;
}

export function DataTable({ columns, children }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.label}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                  column.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">{children}</tbody>
      </table>
    </div>
  );
}
