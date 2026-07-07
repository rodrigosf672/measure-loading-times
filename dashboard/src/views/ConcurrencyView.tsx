import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFilters } from '../hooks/useFilters';
import { PageHead, Panel } from '../components/Panel';
import { byUsers } from '../lib/aggregate';
import { percentile, mean, fmtMs, fmtInt, summarize } from '../lib/stats';
import { StatusChip } from '../components/StatCards';
import { CHART, tooltipStyle, tooltipItemStyle, tooltipLabelStyle } from '../lib/chartTheme';

export function ConcurrencyView() {
  const { filtered } = useFilters();

  const rowsByUser = useMemo(() => {
    const m = byUsers(filtered);
    return [...m.entries()]
      .map(([users, rows]) => {
        const v = rows.map((r) => r.ms);
        const s = summarize(v);
        return {
          users,
          label: `${users}`,
          count: s.count,
          mean: mean(v),
          median: percentile(v, 50),
          p95: percentile(v, 95),
          p99: percentile(v, 99),
        };
      })
      .sort((a, b) => a.users - b.users);
  }, [filtered]);

  // Scaling insight: how much does mean load time grow from the lowest to the
  // highest concurrency level in the current selection?
  const scaling = useMemo(() => {
    if (rowsByUser.length < 2) return null;
    const lo = rowsByUser[0];
    const hi = rowsByUser[rowsByUser.length - 1];
    const ratio = lo.mean > 0 ? hi.mean / lo.mean : 1;
    const status = ratio >= 1.5 ? 'regression' : ratio >= 1.2 ? 'warning' : 'normal';
    return { lo, hi, ratio, status } as const;
  }, [rowsByUser]);

  if (filtered.length === 0) {
    return (
      <>
        <PageHead title="By Concurrency" desc="Effect of concurrent users on load time" />
        <div className="empty"><p className="muted">No measurements match the current filters.</p></div>
      </>
    );
  }

  return (
    <>
      <PageHead title="By Concurrency" desc="How load time responds to concurrent users (1 = one browser)" />

      {scaling && (
        <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <StatusChip
            status={scaling.status}
            label={
              scaling.status === 'normal'
                ? 'Scales cleanly'
                : scaling.status === 'warning'
                  ? 'Mild slowdown under load'
                  : 'Degrades under load'
            }
          />
          <span className="muted" style={{ fontSize: 13 }}>
            Mean load time at {scaling.hi.users} users is{' '}
            <strong style={{ color: 'var(--text)' }}>{scaling.ratio.toFixed(2)}×</strong> the{' '}
            {scaling.lo.users}-user mean ({fmtMs(scaling.lo.mean)} → {fmtMs(scaling.hi.mean)}).
          </span>
        </div>
      )}

      <Panel title="Load time by concurrency level" desc="mean · median · p95 · p99 per Users value">
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={rowsByUser} margin={{ top: 8, right: 16, bottom: 4, left: -6 }} barGap={2}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" stroke={CHART.axis} tick={{ fontSize: 12 }} label={{ value: 'Concurrent users', position: 'insideBottom', offset: -2, fill: CHART.axis, fontSize: 11 }} />
            <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} width={58} />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(v: number, n: string) => [fmtMs(v), n]}
              labelFormatter={(l) => `${l} concurrent user(s)`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="mean" name="mean" fill="#4aa8ff" radius={[3, 3, 0, 0]} />
            <Bar dataKey="median" name="median" fill="#7c8cf8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="p95" name="p95" fill="#b078f0" radius={[3, 3, 0, 0]} />
            <Bar dataKey="p99" name="p99" fill="#e072c4" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Per-level summary" desc="Exact statistics behind the chart">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Users</th>
                <th className="num">Count</th>
                <th className="num">Mean</th>
                <th className="num">Median</th>
                <th className="num">p95</th>
                <th className="num">p99</th>
              </tr>
            </thead>
            <tbody>
              {rowsByUser.map((r) => (
                <tr key={r.users}>
                  <td>{r.users}</td>
                  <td className="num">{fmtInt(r.count)}</td>
                  <td className="num">{fmtMs(r.mean)}</td>
                  <td className="num">{fmtMs(r.median)}</td>
                  <td className="num">{fmtMs(r.p95)}</td>
                  <td className="num">{fmtMs(r.p99)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
