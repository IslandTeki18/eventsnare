import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartCard } from './ChartCard';
import { CHART_COLORS, TOOLTIP_STYLE } from '@/features/analytics/lib/chartTheme';
import { formatBucket, formatMs, type RangeKey } from '@/features/analytics/lib/timeRange';

interface Point {
  hourBucket: number;
  p50: number | null;
  p95: number | null;
}

export function LatencyChart({ series, rangeKey }: { series: Point[]; rangeKey: RangeKey }) {
  return (
    <ChartCard
      title="Delivery latency"
      subtitle="Approximate p50 / p95 (histogram-bucketed)"
      isEmpty={series.length === 0}
    >
      <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="hourBucket"
          tickFormatter={(v: number) => formatBucket(v, rangeKey)}
          stroke={CHART_COLORS.axis}
          fontSize={11}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatMs(v)}
          stroke={CHART_COLORS.axis}
          fontSize={11}
          tickLine={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(v: number) => new Date(v).toLocaleString()}
          formatter={(value, name) => [
            formatMs(typeof value === 'number' ? value : null),
            String(name),
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line
          type="monotone"
          dataKey="p50"
          name="p50"
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="p95"
          name="p95"
          stroke={CHART_COLORS.warning}
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ChartCard>
  );
}
