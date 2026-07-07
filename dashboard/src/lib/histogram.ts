export interface Bin {
  x0: number;
  x1: number;
  mid: number;
  label: string;
  count: number;
}

/**
 * Build a histogram over `values` with `binCount` equal-width bins spanning
 * [min, max]. Uses the Freedman–Diaconis-ish default of ~40 bins capped to the
 * data range. Returns empty array for empty input.
 */
export function histogram(values: number[], binCount = 40): Bin[] {
  if (values.length === 0) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) {
    return [{ x0: min, x1: max, mid: min, label: `${Math.round(min)}`, count: values.length }];
  }
  const n = Math.max(1, Math.min(binCount, values.length));
  const width = (max - min) / n;
  const bins: Bin[] = Array.from({ length: n }, (_, i) => {
    const x0 = min + i * width;
    const x1 = x0 + width;
    return { x0, x1, mid: (x0 + x1) / 2, label: `${Math.round(x0)}`, count: 0 };
  });
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= n) idx = n - 1;
    if (idx < 0) idx = 0;
    bins[idx].count++;
  }
  return bins;
}
