import { useMemo } from 'react';
import { useFilters } from '../hooks/useFilters';
import { PageHead, Panel } from '../components/Panel';
import { StatCards, StatusChip, type Status } from '../components/StatCards';
import { summarize } from '../lib/stats';
import { download, interpret, toCsv, toJson, toMarkdown, type Trend } from '../lib/exporters';

const TREND_STATUS: Record<Trend, Status> = {
  improved: 'normal',
  stable: 'normal',
  degraded: 'regression',
  insufficient: 'warning',
};
const TREND_LABEL: Record<Trend, string> = {
  improved: 'Improved',
  stable: 'Stable',
  degraded: 'Degraded',
  insufficient: 'Insufficient data',
};

export function ReportView() {
  const { filtered, filter } = useFilters();

  const stats = useMemo(() => summarize(filtered.map((r) => r.ms)), [filtered]);
  const interp = useMemo(() => interpret(filtered), [filtered]);
  const markdown = useMemo(() => toMarkdown(filtered, filter), [filtered, filter]);

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  if (filtered.length === 0) {
    return (
      <>
        <PageHead title="Report & Export" desc="Auto-generated summary of the current selection" />
        <div className="empty"><p className="muted">No measurements match the current filters.</p></div>
      </>
    );
  }

  return (
    <>
      <PageHead title="Report & Export" desc="Auto-generated summary of the current selection" />

      <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <StatusChip status={TREND_STATUS[interp.trend]} label={TREND_LABEL[interp.trend]} />
        <span className="muted" style={{ fontSize: 13.5, flex: 1, minWidth: 280 }}>{interp.text}</span>
        <div className="btn-row">
          <button className="btn primary" onClick={() => download(`loading_times_report_${stamp}.md`, markdown, 'text/markdown')}>
            Export Markdown
          </button>
          <button className="btn" onClick={() => download(`loading_times_filtered_${stamp}.csv`, toCsv(filtered), 'text/csv')}>
            Export CSV
          </button>
          <button className="btn" onClick={() => download(`loading_times_filtered_${stamp}.json`, toJson(filtered, filter, stats), 'application/json')}>
            Export JSON
          </button>
        </div>
      </div>

      <StatCards stats={stats} />

      <Panel title="Markdown report preview" desc="Exactly what the Export Markdown button downloads">
        <pre className="report">{markdown}</pre>
      </Panel>
    </>
  );
}
