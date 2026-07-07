import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFilters } from '../hooks/useFilters';
import { PageHead, Panel } from '../components/Panel';
import { StatCards } from '../components/StatCards';
import { summarize, fmtMs } from '../lib/stats';
import { toTimeSeries, byUsers } from '../lib/aggregate';
import { percentile, mean } from '../lib/stats';
import {
  CHART,
  seriesColor,
  tooltipStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
} from '../lib/chartTheme';

export function OverviewView() {
  const { filtered, filter } = useFilters();

  const stats = useMemo(() => summarize(filtered.map((r) => r.ms)), [filtered]);
  const trend = useMemo(
    () => toTimeSeries(filtered, filter.granularity === 'raw' ? 'day' : filter.granularity),
    [filtered, filter.granularity],
  );
  const perUser = useMemo(() => {
    const m = byUsers(filtered);
    return [...m.entries()]
      .map(([users, rows]) => ({
        users: `${users}`,
        usersNum: users,
        mean: mean(rows.map((r) => r.ms)),
        p95: percentile(rows.map((r) => r.ms), 95),
      }))
      .sort((a, b) => a.usersNum - b.usersNum);
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <>
        <PageHead title="Overview" desc="Summary of the current selection" />
        <div className="empty">
          <p className="muted">No measurements match the current filters.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Overview"
        desc={`${filtered.length.toLocaleString()} measurements in the current selection`}
      />
      <StatCards stats={stats} />

      <div className="grid-2">
        <Panel title="Load-time trend" desc="Mean with p95 band">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="ovMean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART.accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" stroke={CHART.axis} tick={{ fontSize: 11 }} minTickGap={40} />
              <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} width={54} unit="" />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(v: number, name: string) => [fmtMs(v), name]}
              />
              <Area
                type="monotone"
                dataKey="p95"
                stroke="#ff7a59"
                strokeWidth={1}
                fill="none"
                dot={false}
                name="p95"
              />
              <Area
                type="monotone"
                dataKey="mean"
                stroke={CHART.accent}
                strokeWidth={2}
                fill="url(#ovMean)"
                dot={false}
                name="mean"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Mean load time by concurrency" desc="Users = concurrent browsers">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={perUser} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="users" stroke={CHART.axis} tick={{ fontSize: 11 }} />
              <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} width={54} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(v: number, name: string) => [fmtMs(v), name]}
                labelFormatter={(l) => `${l} concurrent user(s)`}
              />
              <Bar dataKey="mean" name="mean" radius={[4, 4, 0, 0]} fill={CHART.accent} />
            </BarChart>
          </ResponsiveContainer>
          <div className="btn-row" style={{ marginTop: 10 }}>
            {perUser.map((p) => (
              <span key={p.users} className="faint" style={{ fontSize: 12 }}>
                <span style={{ color: seriesColor(p.usersNum) }}>●</span> {p.users}u: {fmtMs(p.mean)}
              </span>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
