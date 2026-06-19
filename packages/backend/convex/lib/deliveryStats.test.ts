import { describe, it, expect } from 'vitest';
import {
  hourBucketOf,
  latencyBucketIndex,
  percentileFromBuckets,
  LATENCY_BUCKET_COUNT,
  LATENCY_EDGES,
} from './deliveryStats';

describe('hourBucketOf', () => {
  it('floors to the hour in epoch ms', () => {
    const base = 1_700_000_000_000;
    const flooredToHour = Math.floor(base / 3_600_000) * 3_600_000;
    expect(hourBucketOf(base)).toBe(flooredToHour);
    expect(hourBucketOf(flooredToHour)).toBe(flooredToHour);
    expect(hourBucketOf(flooredToHour + 3_599_999)).toBe(flooredToHour);
    expect(hourBucketOf(flooredToHour + 3_600_000)).toBe(flooredToHour + 3_600_000);
  });
});

describe('latencyBucketIndex', () => {
  it('maps values below the first edge to bucket 0', () => {
    expect(latencyBucketIndex(0)).toBe(0);
    expect(latencyBucketIndex(99)).toBe(0);
  });

  it('maps boundary values to the upper bucket (edge is exclusive lower bound)', () => {
    expect(latencyBucketIndex(100)).toBe(1);
    expect(latencyBucketIndex(250)).toBe(2);
  });

  it('maps values at or above the last edge to the open-ended top bucket', () => {
    expect(latencyBucketIndex(30000)).toBe(LATENCY_EDGES.length);
    expect(latencyBucketIndex(120000)).toBe(LATENCY_EDGES.length);
    expect(latencyBucketIndex(LATENCY_EDGES.length)).toBeLessThan(LATENCY_BUCKET_COUNT);
  });
});

describe('percentileFromBuckets', () => {
  it('returns null with no samples', () => {
    expect(percentileFromBuckets(new Array(LATENCY_BUCKET_COUNT).fill(0), 0.5)).toBeNull();
  });

  it('returns the bucket upper edge containing the percentile', () => {
    // 10 samples all in bucket 0 (<100ms): any percentile resolves to the 100ms edge.
    const buckets = new Array(LATENCY_BUCKET_COUNT).fill(0);
    buckets[0] = 10;
    expect(percentileFromBuckets(buckets, 0.5)).toBe(100);
    expect(percentileFromBuckets(buckets, 0.95)).toBe(100);
  });

  it('separates p50 and p95 across buckets', () => {
    // 90 fast (<100ms), 10 slow (1000-2000ms => bucket index 4, edge 2000).
    const buckets = new Array(LATENCY_BUCKET_COUNT).fill(0);
    buckets[0] = 90;
    buckets[4] = 10;
    expect(percentileFromBuckets(buckets, 0.5)).toBe(100);
    expect(percentileFromBuckets(buckets, 0.95)).toBe(2000);
  });

  it('returns the last finite edge for the open-ended top bucket', () => {
    const buckets = new Array(LATENCY_BUCKET_COUNT).fill(0);
    buckets[LATENCY_BUCKET_COUNT - 1] = 5;
    expect(percentileFromBuckets(buckets, 0.5)).toBe(LATENCY_EDGES[LATENCY_EDGES.length - 1]);
  });
});
