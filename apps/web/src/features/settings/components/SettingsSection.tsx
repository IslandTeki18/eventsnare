import type { ReactNode } from 'react';

// Full-bleed settings section: a heading, optional explanation, and rows beneath. Sections are
// separated by hairlines rather than card borders.

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  last?: boolean;
}

export function SettingsSection({
  title,
  description,
  children,
  last = false,
}: SettingsSectionProps) {
  return (
    <section className={`px-[22px] py-5 ${last ? 'pb-[30px]' : 'border-b border-border'}`}>
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1.5 max-w-[620px] text-sm leading-[18px] text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
