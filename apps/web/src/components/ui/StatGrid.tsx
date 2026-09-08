import type { ReactNode } from 'react';

// Full-bleed metric strip: auto-fitting cells divided by hairlines, no card chrome.

export interface Stat {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: 'default' | 'ok' | 'warn' | 'bad';
}

const TONES: Record<NonNullable<Stat['tone']>, string> = {
  default: 'text-foreground',
  ok: 'text-ok',
  warn: 'text-warn',
  bad: 'text-bad',
};

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div
      className="grid border-b border-border"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="border-l border-border-soft px-[22px] py-4">
          <div className="text-xs text-subtle">{stat.label}</div>
          <div
            className={`mt-1.5 text-2xl font-semibold tabular-nums tracking-[-0.02em] ${TONES[stat.tone ?? 'default']}`}
          >
            {stat.value}
          </div>
          {stat.note ? <div className="mt-1 text-xs text-subtle">{stat.note}</div> : null}
        </div>
      ))}
    </div>
  );
}
