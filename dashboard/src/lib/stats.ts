import type { Stats } from './types';

/**
 * Percentile via linear interpolation between closest ranks (the same method
 * numpy uses by default: "linear" / R type 7). `p` is in [0, 100].
 * Operates on a copy; does not mutate the input.
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return NaN;
  if (values.length === 1) return values[0];
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  const frac = rank - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

export function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

export function median(values: number[]): number {
  return percentile(values, 50);
}

export function stddev(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const m = mean(values);
  let acc = 0;
  for (const v of values) acc += (v - m) * (v - m);
  return Math.sqrt(acc / (n - 1)); // sample standard deviation
}

/** Full summary-stat bundle over a list of loading-time values (ms). */
export function summarize(values: number[]): Stats {
  if (values.length === 0) {
    return { count: 0, mean: NaN, median: NaN, p95: NaN, p99: NaN, min: NaN, max: NaN, std: NaN };
  }
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    mean: mean(sorted),
    median: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    std: stddev(sorted),
  };
}

/** Format milliseconds for compact display, e.g. 1333 -> "1,333 ms", 62000 -> "62.0 s". */
export function fmtMs(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  if (ms >= 10_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms).toLocaleString()} ms`;
}

/** Compact integer formatting with thousands separators. */
export function fmtInt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString();
}
