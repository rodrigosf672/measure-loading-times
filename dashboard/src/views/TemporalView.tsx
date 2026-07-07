import { useMemo } from 'react';
import {
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
import { groupBy, DOW_LABELS, MONTH_LABELS } from '../lib/data';
import { mean, percentile, fmtMs, fmtInt } from '../lib/stats';
import { CHART, tooltipStyle, tooltipItemStyle, tooltipLabelStyle } from '../lib/chartTheme';
import type { Measurement } from '../lib/types';

interface Row {
  key: string;
  mean: number;
  p95: number;
  count: number;
}

function aggregate<K extends number>(
  rows: Measurement[],
  keyFn: (m: Measurement) => K,
  labels: (k: K) => string,
  domain: K[],
): Row[] {
  const g = groupBy(rows, keyFn);
  return domain.map((k) => {
    const arr = g.get(k) ?? [];
    const v = arr.map((r) => r.ms);
    return {
      key: labels(k),
      mean: v.length ? mean(v) : 0,
      p95: v.length ? percentile(v, 95) : 0,
      count: v.length,
    };
  });
}

function PatternChart({ data, title, desc }: { data: Row[]; title: string; desc: string }) {
  return (
    <Panel title={title} desc={desc}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="key" stroke={CHART.axis} tick={{ fontSize: 11 }} interval={0} minTickGap={0} />
          <YAxis stroke={CHART.axis} tick={{ fontSize: 11 }} width={54} />
          <Tooltip
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(v: number, n: string) => [n === 'count' ? fmtInt(v) : fmtMs(v), n]}
          />
          <Bar dataKey="mean" name="mean" fill={CHART.accent} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function TemporalView() {
  const { filtered } = useFilters();

  const byHour = useMemo(
    () =>
      aggregate(
        filtered,
        (m) => m.hour,
        (h) => `${h}`.padStart(2, '0'),
        Array.from({ length: 24 }, (_, i) => i),
      ),
    [filtered],
  );

  const byDow = useMemo(
    () =>
      aggregate(
        filtered,
        (m) => m.dayOfWeek,
        (d) => DOW_LABELS[d],
        [0, 1, 2, 3, 4, 5, 6],
      ),
    [filtered],
  );

  const byMonth = useMemo(
    () =>
      aggregate(
        filtered,
        (m) => m.month,
        (mo) => MONTH_LABELS[mo - 1],
        Array.from({ length: 12 }, (_, i) => i + 1),
      ),
    [filtered],
  );

  if (filtered.length === 0) {
    return (
      <>
        <PageHead title="Temporal Patterns" desc="Load time by hour, weekday and month" />
        <div className="empty"><p className="muted">No measurements match the current filters.</p></div>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Temporal Patterns"
        desc="When are pages slow? Load time grouped by hour-of-day, day-of-week and month"
      />
      <PatternChart data={byHour} title="By hour of day" desc="Local time · mean load time (00–23h)" />
      <div className="grid-2">
        <PatternChart data={byDow} title="By day of week" desc="Mean load time" />
        <PatternChart data={byMonth} title="By month" desc="Mean load time" />
      </div>
    </>
  );
}
