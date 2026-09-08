import type { ReactNode } from 'react';

// Full-bleed settings row: label and explanation on the left, the control on the right,
// stacking on narrow viewports. Rows are separated by hairlines, not cards.

interface SettingRowProps {
  label: string;
  description?: ReactNode;
  children: ReactNode;
  last?: boolean;
}

export function SettingRow({ label, description, children, last = false }: SettingRowProps) {
  return (
    <div
      className={`flex flex-wrap items-start gap-[18px] px-[22px] py-5 ${
        last ? '' : 'border-b border-border'
      }`}
    >
      <div className="min-w-0 flex-1 basis-[240px]">
        <div className="text-sm font-medium">{label}</div>
        {description ? (
          <div className="mt-1 text-sm leading-[18px] text-muted-foreground">{description}</div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-2">{children}</div>
    </div>
  );
}
