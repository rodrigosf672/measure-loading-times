import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { useFilters } from '../hooks/useFilters';
import { PageHead, Panel } from '../components/Panel';
import { toTimeSeries, toMultiSeries } from '../lib/aggregate';
import { fmtMs } from '../lib/stats';
import {
  CHART,
  seriesColor,
  tooltipStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
} from '../lib/chartTheme';

type Metric = 'mean' | 'median' | 'p95';

export function TimeSeriesView() {
  const { filtered, filter } = useFilters();
  const [metric, setMetric] = useState<Metric>('mean');
  const [split, setSplit] = useState(false);

  const g = filter.granularity;

  const single = useMemo(() => toTimeSeries(filtered, g), [filtered, g]);
  const multi = useMemo(() => toMultiSeries(filtered, g, metric), [filtered, g, metric]);

  if (filtered.length === 0) {
    return (
      <>
        <PageHead title="Time Series" desc="Load time over time" />
        <div className="empty"><p className="muted">No measurements match the current filters.</p></div>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Time Series"
        desc={`Load-time trend · ${g === 'raw' ? 'raw points' : `${g} buckets`} · ${single.length.toLocaleString()} points`}
      />

      <Panel
        title={split ? 'Load time by concurrency over time' : 'Load-time trend'}
        desc={split ? `${metric} per concurrency level` : 'mean · median · p95'}
        right={
          <div className="btn-row">
            <div className="seg">
              <button className={!split ? 'active' : ''} onClick={() => setSplit(false)}>Combined</button>
              <button className={split ? 'active' : ''} onClick={() => setSplit(true)}>By Users</button>
            </div>
            {split && (
              <div className="seg">
                {(['mean', 'median', 'p95'] as Metric[]).map((m) => (
                  <button key={m} className={metric === m ? 'active' : ''} onClick={() => setMetric(m)}>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={420}>
          {split ? (
            <LineChart data={multi.data} margin={{ top: 6, right: 16, bottom: 4, left: -6 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" stroke={CHART.axis} tick={{ fontSize: 11 }} minTickGap={44} />
              <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} width={58} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(v: number, n: string) => [fmtMs(v), n.replace('u', '') + 'u']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {multi.users.map((u) => (
                <Line
                  key={u}
                  type="monotone"
                  dataKey={`u${u}`}
                  name={`${u} users`}
                  stroke={seriesColor(u)}
                  strokeWidth={1.75}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          ) : (
            <LineChart data={single} margin={{ top: 6, right: 16, bottom: 4, left: -6 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" stroke={CHART.axis} tick={{ fontSize: 11 }} minTickGap={44} />
              <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} width={58} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(v: number, n: string) => [fmtMs(v), n]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="mean" name="mean" stroke={CHART.accent} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="median" name="median" stroke="#7c8cf8" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="p95" name="p95" stroke="#ff7a59" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </Panel>
    </>
  );
}
