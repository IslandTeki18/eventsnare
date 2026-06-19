import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartCard } from './ChartCard';
import { CHART_COLORS, TOOLTIP_STYLE } from '@/features/analytics/lib/chartTheme';
import { formatBucket, formatPercent, type RangeKey } from '@/features/analytics/lib/timeRange';

interface Point {
  hourBucket: number;
  successRate: number;
}

export function SuccessRateChart({ series, rangeKey }: { series: Point[]; rangeKey: RangeKey }) {
  return (
    <ChartCard title="Delivery success rate" isEmpty={series.length === 0}>
      <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="hourBucket"
          tickFormatter={(v: number) => formatBucket(v, rangeKey)}
          stroke={CHART_COLORS.axis}
          fontSize={11}
          tickLine={false}
        />
        <YAxis
          domain={[0, 1]}
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          stroke={CHART_COLORS.axis}
          fontSize={11}
          tickLine={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(v: number) => new Date(v).toLocaleString()}
          formatter={(v: number) => [formatPercent(v), 'Success rate']}
        />
        <Area
          type="monotone"
          dataKey="successRate"
          stroke={CHART_COLORS.success}
          fill={CHART_COLORS.success}
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartCard>
  );
}
