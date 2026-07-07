import type { Stats } from '../lib/types';
import { fmtInt, fmtMs } from '../lib/stats';

export type Status = 'normal' | 'warning' | 'regression' | 'failure';

export function StatusChip({ status, label }: { status: Status; label: string }) {
  return (
    <span className={`chip ${status}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

function Card({ label, value, unit, sub, status }: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  status?: Status;
}) {
  const cls = status ? ` status-${status}` : '';
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${cls}`}>
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/**
 * Row of summary stat cards. Color is applied ONLY to p95/p99 as a status signal
 * (relative to the median), never as decoration.
 */
export function StatCards({ stats }: { stats: Stats }) {
  // Status heuristic: how inflated the tail is versus the median.
  const tailRatio = stats.median > 0 ? stats.p95 / stats.median : 1;
  const p95Status: Status =
    tailRatio >= 1.75 ? 'regression' : tailRatio >= 1.35 ? 'warning' : 'normal';
  const p99Ratio = stats.median > 0 ? stats.p99 / stats.median : 1;
  const p99Status: Status =
    p99Ratio >= 2.2 ? 'regression' : p99Ratio >= 1.6 ? 'warning' : 'normal';

  return (
    <div className="stat-grid">
      <Card label="Measurements" value={fmtInt(stats.count)} />
      <Card label="Average" value={fmtMs(stats.mean)} />
      <Card label="Median (p50)" value={fmtMs(stats.median)} />
      <Card label="p95" value={fmtMs(stats.p95)} status={p95Status} sub={`${(tailRatio).toFixed(2)}× median`} />
      <Card label="p99" value={fmtMs(stats.p99)} status={p99Status} sub={`${(p99Ratio).toFixed(2)}× median`} />
      <Card label="Min" value={fmtMs(stats.min)} />
      <Card label="Max" value={fmtMs(stats.max)} />
      <Card label="Std dev" value={fmtMs(stats.std)} />
    </div>
  );
}
