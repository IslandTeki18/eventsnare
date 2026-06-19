import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartCard } from './ChartCard';
import { CHART_COLORS, TOOLTIP_STYLE } from '@/features/analytics/lib/chartTheme';
import { formatBucket, type RangeKey } from '@/features/analytics/lib/timeRange';

interface Point {
  hourBucket: number;
  succeeded: number;
  failed: number;
}

export function VolumeChart({ series, rangeKey }: { series: Point[]; rangeKey: RangeKey }) {
  return (
    <ChartCard title="Delivery volume" subtitle="Attempts per bucket" isEmpty={series.length === 0}>
      <BarChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="hourBucket"
          tickFormatter={(v: number) => formatBucket(v, rangeKey)}
          stroke={CHART_COLORS.axis}
          fontSize={11}
          tickLine={false}
        />
        <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(v: number) => new Date(v).toLocaleString()}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="succeeded" name="Delivered" stackId="v" fill={CHART_COLORS.success} />
        <Bar dataKey="failed" name="Failed" stackId="v" fill={CHART_COLORS.danger} />
      </BarChart>
    </ChartCard>
  );
}
