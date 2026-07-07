import type { FilterState, Measurement, Stats } from './types';
import { summarize, percentile, mean, fmtMs } from './stats';

/** Trigger a browser download of a text blob. */
export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Filtered rows -> CSV, preserving the original 3-column schema exactly. */
export function toCsv(rows: Measurement[]): string {
  const lines = ['Timestamp,Users,Avg_Loading_Time'];
  for (const r of rows) lines.push(`${r.timestamp},${r.users},${r.ms}`);
  return lines.join('\n') + '\n';
}

/** Filtered rows -> JSON with the original fields plus derived time fields. */
export function toJson(rows: Measurement[], filter: FilterState, stats: Stats): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      filter: {
        from: filter.from ? new Date(filter.from).toISOString() : null,
        to: filter.to ? new Date(filter.to).toISOString() : null,
        users: filter.users.length ? filter.users : 'all',
        granularity: filter.granularity,
      },
      summary: stats,
      measurements: rows.map((r) => ({
        timestamp: r.timestamp,
        users: r.users,
        avgLoadingTimeMs: r.ms,
      })),
    },
    null,
    2,
  );
}

export type Trend = 'improved' | 'stable' | 'degraded' | 'insufficient';

export interface Interpretation {
  trend: Trend;
  deltaPct: number;
  baselineMean: number;
  recentMean: number;
  baselineN: number;
  recentN: number;
  text: string;
}

/**
 * Compare the most recent 20% of the filtered window (by count) against the
 * earliest 20% as a baseline. A meaningful move is |Δ| >= 10% of the baseline
 * mean. This is a simple, transparent regression heuristic over the load-time
 * data we actually have — not a statistical test.
 */
export function interpret(rows: Measurement[]): Interpretation {
  const n = rows.length;
  if (n < 10) {
    return {
      trend: 'insufficient',
      deltaPct: 0,
      baselineMean: NaN,
      recentMean: NaN,
      baselineN: 0,
      recentN: 0,
      text: 'Not enough measurements in the current selection to assess a trend (need ≥ 10).',
    };
  }
  const sorted = [...rows].sort((a, b) => a.t - b.t);
  const k = Math.max(3, Math.floor(n * 0.2));
  const baseline = sorted.slice(0, k).map((r) => r.ms);
  const recent = sorted.slice(-k).map((r) => r.ms);
  const bMean = mean(baseline);
  const rMean = mean(recent);
  const deltaPct = bMean > 0 ? ((rMean - bMean) / bMean) * 100 : 0;
  let trend: Trend = 'stable';
  if (deltaPct >= 10) trend = 'degraded';
  else if (deltaPct <= -10) trend = 'improved';
  const dir = deltaPct >= 0 ? 'slower' : 'faster';
  const text =
    trend === 'stable'
      ? `Performance is stable: the most recent ${k} measurements average ${fmtMs(rMean)}, within ±10% of the earliest ${k} (${fmtMs(bMean)}).`
      : `Performance has ${trend}: the most recent ${k} measurements average ${fmtMs(rMean)}, ${Math.abs(deltaPct).toFixed(1)}% ${dir} than the earliest ${k} (${fmtMs(bMean)}).`;
  return { trend, deltaPct, baselineMean: bMean, recentMean: rMean, baselineN: k, recentN: k, text };
}

/** Build a Markdown report of the current filtered selection. */
export function toMarkdown(rows: Measurement[], filter: FilterState): string {
  const stats = summarize(rows.map((r) => r.ms));
  const interp = interpret(rows);
  const usersSel = filter.users.length ? filter.users.join(', ') : 'all';
  const from = filter.from ? new Date(filter.from).toISOString() : 'beginning';
  const to = filter.to ? new Date(filter.to).toISOString() : 'latest';

  // Per-concurrency breakdown table.
  const levels = [...new Set(rows.map((r) => r.users))].sort((a, b) => a - b);
  const perLevel = levels.map((u) => {
    const v = rows.filter((r) => r.users === u).map((r) => r.ms);
    return `| ${u} | ${v.length} | ${mean(v).toFixed(1)} | ${percentile(v, 50).toFixed(1)} | ${percentile(v, 95).toFixed(1)} | ${percentile(v, 99).toFixed(1)} |`;
  });

  return [
    '# Loading-Time Report',
    '',
    `_Generated ${new Date().toISOString()} by PerfScope. Source: loading_times.csv (Playwright measurement, unchanged)._`,
    '',
    '## Selection',
    '',
    `- **Date range:** ${from} → ${to}`,
    `- **Concurrency (Users):** ${usersSel}`,
    `- **Measurements:** ${stats.count.toLocaleString()}`,
    '',
    '## Summary (page load time, ms)',
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| Mean | ${stats.mean.toFixed(1)} |`,
    `| Median (p50) | ${stats.median.toFixed(1)} |`,
    `| p95 | ${stats.p95.toFixed(1)} |`,
    `| p99 | ${stats.p99.toFixed(1)} |`,
    `| Min | ${stats.min.toFixed(1)} |`,
    `| Max | ${stats.max.toFixed(1)} |`,
    `| Std dev | ${stats.std.toFixed(1)} |`,
    '',
    '## By concurrency level',
    '',
    '| Users | Count | Mean | Median | p95 | p99 |',
    '| ---: | ---: | ---: | ---: | ---: | ---: |',
    ...perLevel,
    '',
    '## Interpretation',
    '',
    `**${interp.trend.toUpperCase()}** — ${interp.text}`,
    '',
    '---',
    '_This dashboard only visualizes existing measurements; it does not change how data is collected. `https://google.com` is used solely as a stable educational test case._',
    '',
  ].join('\n');
}
