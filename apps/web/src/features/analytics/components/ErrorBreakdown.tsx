import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { ChartCard } from './ChartCard';
import { CHART_COLORS, TOOLTIP_STYLE } from '@/features/analytics/lib/chartTheme';

// Status code -> count, sorted by frequency. 2xx codes render success-green, everything else
// (4xx/5xx/transport "error") renders rose so failure modes stand out.
function isSuccessCode(code: string): boolean {
  const n = Number(code);
  return Number.isFinite(n) && n >= 200 && n < 300;
}

export function ErrorBreakdown({ statusCounts }: { statusCounts: Record<string, number> }) {
  const data = Object.entries(statusCounts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <ChartCard title="Response code breakdown" isEmpty={data.length === 0} height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="code" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} />
        <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="count" name="Responses">
          {data.map((d) => (
            <Cell
              key={d.code}
              fill={isSuccessCode(d.code) ? CHART_COLORS.success : CHART_COLORS.danger}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartCard>
  );
}
