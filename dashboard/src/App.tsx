import { useEffect, useMemo, useState } from 'react';
import { FilterProvider } from './hooks/useFilters';
import { FilterBar } from './components/FilterBar';
import { loadMeasurements, distinctUsers, timeExtent } from './lib/data';
import type { Measurement } from './lib/types';
import { OverviewView } from './views/OverviewView';
import { TimeSeriesView } from './views/TimeSeriesView';
import { DistributionView } from './views/DistributionView';
import { ConcurrencyView } from './views/ConcurrencyView';
import { TemporalView } from './views/TemporalView';
import { TableView } from './views/TableView';
import { ReportView } from './views/ReportView';

type ViewId =
  | 'overview'
  | 'timeseries'
  | 'distribution'
  | 'concurrency'
  | 'temporal'
  | 'table'
  | 'report';

const NAV: { id: ViewId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'timeseries', label: 'Time Series', icon: '〰' },
  { id: 'distribution', label: 'Distribution', icon: '▤' },
  { id: 'concurrency', label: 'By Concurrency', icon: '▥' },
  { id: 'temporal', label: 'Temporal Patterns', icon: '◷' },
  { id: 'table', label: 'Data Table', icon: '▦' },
  { id: 'report', label: 'Report & Export', icon: '⎙' },
];

export default function App() {
  const [rows, setRows] = useState<Measurement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewId>('overview');

  useEffect(() => {
    loadMeasurements()
      .then(setRows)
      .catch((e) => setError(String(e?.message ?? e)));
  }, []);

  const extent = useMemo(() => (rows ? timeExtent(rows) : null), [rows]);
  const userLevels = useMemo(() => (rows ? distinctUsers(rows) : []), [rows]);

  if (error) {
    return (
      <div className="empty">
        <div>
          <h2>Could not load data</h2>
          <p className="muted">{error}</p>
          <p className="faint">
            Expected <code className="inline">public/data/loading_times.csv</code>. Run{' '}
            <code className="inline">npm run copy-data</code> to refresh it from the repo root.
          </p>
        </div>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="loading">
        <div className="spinner" />
        <div className="muted">Loading loading_times.csv…</div>
      </div>
    );
  }

  return (
    <FilterProvider all={rows} extent={extent} userLevels={userLevels}>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">P</div>
            <div>
              <div className="brand-name">PerfScope</div>
              <div className="brand-sub">Loading-time observability</div>
            </div>
          </div>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item${view === n.id ? ' active' : ''}`}
              onClick={() => setView(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
          <div className="sidebar-foot">
            {rows.length.toLocaleString()} measurements
            <br />
            Powered by Playwright · reads
            <br />
            <code className="inline">loading_times.csv</code>
          </div>
        </aside>

        <div className="main">
          <FilterBar />
          <div className="content">
            {view === 'overview' && <OverviewView />}
            {view === 'timeseries' && <TimeSeriesView />}
            {view === 'distribution' && <DistributionView />}
            {view === 'concurrency' && <ConcurrencyView />}
            {view === 'temporal' && <TemporalView />}
            {view === 'table' && <TableView />}
            {view === 'report' && <ReportView />}
          </div>
        </div>
      </div>
    </FilterProvider>
  );
}
