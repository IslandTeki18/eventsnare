// Shapes returned by the analytics queries (packages/backend/convex/analytics.ts). Declared
// here so chart components depend on a stable local contract rather than inferring deep Convex
// query types.

export type EndpointHealth = 'healthy' | 'degraded' | 'down' | 'idle';

export interface SourceSeriesPoint {
  hourBucket: number;
  attempts: number;
  succeeded: number;
  failed: number;
  deadLettered: number;
  successRate: number;
  p50: number | null;
  p95: number | null;
}

export interface OverviewSeriesPoint {
  hourBucket: number;
  attempts: number;
  succeeded: number;
  failed: number;
  successRate: number;
}

export interface Totals {
  attempts: number;
  succeeded: number;
  failed: number;
  deadLettered: number;
  successRate: number;
  health: EndpointHealth;
}

export interface SourceCard {
  sourceId: string;
  name: string;
  forwardUrl: string;
  attempts: number;
  succeeded: number;
  failed: number;
  deadLettered: number;
  successRate: number;
  health: EndpointHealth;
}
