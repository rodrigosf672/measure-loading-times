import type { Granularity, Measurement } from './types';
import { bucketStart, groupBy } from './data';
import { mean, percentile } from './stats';

export interface TimePoint {
  t: number;
  label: string;
  mean: number;
  p95: number;
  median: number;
  count: number;
}

function fmtBucketLabel(t: number, g: Granularity): string {
  const d = new Date(t);
  switch (g) {
    case 'hour':
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' });
    case 'day':
    case 'week':
      return d.toLocaleDateString(undefined, { year: '2-digit', month: 'short', day: 'numeric' });
    case 'month':
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    case 'raw':
    default:
      return d.toLocaleString();
  }
}

/**
 * Aggregate rows into ordered time buckets for the given granularity.
 * 'raw' returns one point per measurement (no aggregation).
 */
export function toTimeSeries(rows: Measurement[], g: Granularity): TimePoint[] {
  if (g === 'raw') {
    return rows.map((r) => ({
      t: r.t,
      label: new Date(r.t).toLocaleString(),
      mean: r.ms,
      p95: r.ms,
      median: r.ms,
      count: 1,
    }));
  }
  const groups = groupBy(rows, (r) => bucketStart(r.t, g));
  const points: TimePoint[] = [];
  for (const [t, arr] of groups) {
    const vals = arr.map((r) => r.ms);
    points.push({
      t,
      label: fmtBucketLabel(t, g),
      mean: mean(vals),
      p95: percentile(vals, 95),
      median: percentile(vals, 50),
      count: vals.length,
    });
  }
  points.sort((a, b) => a.t - b.t);
  return points;
}

/** Split rows by concurrency level into a Map<users, rows>. */
export function byUsers(rows: Measurement[]): Map<number, Measurement[]> {
  return groupBy(rows, (r) => r.users);
}

/** Build a per-bucket series split by concurrency level, for multi-line charts. */
export interface MultiPoint {
  t: number;
  label: string;
  [seriesKey: string]: number | string;
}

export function toMultiSeries(
  rows: Measurement[],
  g: Granularity,
  metric: 'mean' | 'p95' | 'median' = 'mean',
): { data: MultiPoint[]; users: number[] } {
  const users = [...new Set(rows.map((r) => r.users))].sort((a, b) => a - b);
  if (g === 'raw') {
    // raw: one point per measurement keyed by its users series
    const data: MultiPoint[] = rows.map((r) => ({
      t: r.t,
      label: new Date(r.t).toLocaleString(),
      [`u${r.users}`]: r.ms,
    }));
    return { data, users };
  }
  const bucketMap = new Map<number, Map<number, number[]>>();
  for (const r of rows) {
    const b = bucketStart(r.t, g);
    let inner = bucketMap.get(b);
    if (!inner) {
      inner = new Map();
      bucketMap.set(b, inner);
    }
    const arr = inner.get(r.users);
    if (arr) arr.push(r.ms);
    else inner.set(r.users, [r.ms]);
  }
  const buckets = [...bucketMap.keys()].sort((a, b) => a - b);
  const agg = (vals: number[]) =>
    metric === 'mean' ? mean(vals) : percentile(vals, metric === 'p95' ? 95 : 50);
  const data: MultiPoint[] = buckets.map((t) => {
    const point: MultiPoint = { t, label: fmtBucketLabel(t, g) };
    const inner = bucketMap.get(t)!;
    for (const u of users) {
      const vals = inner.get(u);
      if (vals && vals.length) point[`u${u}`] = agg(vals);
    }
    return point;
  });
  return { data, users };
}
