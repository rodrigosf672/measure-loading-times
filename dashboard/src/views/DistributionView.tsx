import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFilters } from '../hooks/useFilters';
import { PageHead, Panel } from '../components/Panel';
import { histogram } from '../lib/histogram';
import { percentile, summarize, fmtMs, fmtInt } from '../lib/stats';
import { byUsers } from '../lib/aggregate';
import { CHART, seriesColor, tooltipStyle, tooltipItemStyle, tooltipLabelStyle } from '../lib/chartTheme';

export function DistributionView() {
  const { filtered } = useFilters();
  const [bins, setBins] = useState(40);

  const values = useMemo(() => filtered.map((r) => r.ms), [filtered]);
  const stats = useMemo(() => summarize(values), [values]);
  const hist = useMemo(() => histogram(values, bins), [values, bins]);

  // Per-concurrency five-number summary (min, p25, median, p75, max) for a
  // horizontal box-style comparison.
  const boxes = useMemo(() => {
    const m = byUsers(filtered);
    return [...m.entries()]
      .map(([users, rows]) => {
        const v = rows.map((r) => r.ms);
        return {
          users,
          min: percentile(v, 0),
          q1: percentile(v, 25),
          median: percentile(v, 50),
          q3: percentile(v, 75),
          p95: percentile(v, 95),
          max: percentile(v, 100),
          n: v.length,
        };
      })
      .sort((a, b) => a.users - b.users);
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <>
        <PageHead title="Distribution" desc="How load times are spread" />
        <div className="empty"><p className="muted">No measurements match the current filters.</p></div>
      </>
    );
  }

  const globalMax = boxes.reduce((mx, b) => Math.max(mx, b.max), 0);

  return (
    <>
      <PageHead title="Distribution" desc={`${fmtInt(stats.count)} load-time measurements`} />

      <Panel
        title="Histogram of load times"
        desc="median (blue) · p95 (orange) marked"
        right={
          <div className="seg">
            {[20, 40, 60].map((b) => (
              <button key={b} className={bins === b ? 'active' : ''} onClick={() => setBins(b)}>
                {b} bins
              </button>
            ))}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={hist} margin={{ top: 8, right: 16, bottom: 4, left: -6 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis
              dataKey="mid"
              stroke={CHART.axis}
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => `${Math.round(v)}`}
              minTickGap={28}
            />
            <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} width={48} />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(v: number) => [fmtInt(v), 'count']}
              labelFormatter={(v: number) => `≈ ${fmtMs(v)}`}
            />
            <ReferenceLine x={stats.median} stroke={CHART.accent} strokeWidth={1.5} />
            <ReferenceLine x={stats.p95} stroke="#ff7a59" strokeWidth={1.5} strokeDasharray="4 3" />
            <Bar dataKey="count" fill={CHART.accent} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Spread by concurrency" desc="min · IQR (25–75%) · median · p95 · max per Users level">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '6px 2px' }}>
          {boxes.map((b) => (
            <div key={b.users} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 64, fontSize: 12.5 }} className="muted">
                {b.users} user{b.users > 1 ? 's' : ''}
                <div className="faint" style={{ fontSize: 11 }}>{fmtInt(b.n)} pts</div>
              </div>
              <div style={{ position: 'relative', flex: 1, height: 26 }}>
                {/* whisker min→max */}
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: `${(b.min / globalMax) * 100}%`,
                    width: `${((b.max - b.min) / globalMax) * 100}%`,
                    height: 2,
                    background: 'var(--border-strong)',
                  }}
                />
                {/* IQR box */}
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: `${(b.q1 / globalMax) * 100}%`,
                    width: `${((b.q3 - b.q1) / globalMax) * 100}%`,
                    height: 18,
                    background: `${seriesColor(b.users)}33`,
                    border: `1px solid ${seriesColor(b.users)}`,
                    borderRadius: 4,
                  }}
                />
                {/* median tick */}
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: `${(b.median / globalMax) * 100}%`,
                    width: 2,
                    height: 22,
                    background: seriesColor(b.users),
                  }}
                />
                {/* p95 marker */}
                <div
                  title={`p95 ${fmtMs(b.p95)}`}
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: `${(b.p95 / globalMax) * 100}%`,
                    width: 2,
                    height: 14,
                    background: '#ff7a59',
                  }}
                />
              </div>
              <div style={{ width: 150, fontSize: 12, textAlign: 'right' }} className="faint">
                med {fmtMs(b.median)} · p95 {fmtMs(b.p95)}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
