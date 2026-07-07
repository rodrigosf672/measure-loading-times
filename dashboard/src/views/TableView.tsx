import { useMemo, useState } from 'react';
import { useFilters } from '../hooks/useFilters';
import { PageHead, Panel } from '../components/Panel';
import { fmtInt } from '../lib/stats';
import { download, toCsv, toJson, toMarkdown } from '../lib/exporters';
import { summarize } from '../lib/stats';
import type { Measurement } from '../lib/types';

type SortKey = 'timestamp' | 'users' | 'ms';
type SortDir = 'asc' | 'desc';
const PAGE = 50;

export function TableView() {
  const { filtered, filter } = useFilters();
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  const searched = useMemo(() => {
    if (!q.trim()) return filtered;
    const needle = q.trim().toLowerCase();
    return filtered.filter(
      (r) =>
        r.timestamp.toLowerCase().includes(needle) ||
        `${r.users}`.includes(needle) ||
        `${r.ms}`.includes(needle),
    );
  }, [filtered, q]);

  const sorted = useMemo(() => {
    const arr = [...searched];
    arr.sort((a: Measurement, b: Measurement) => {
      let cmp = 0;
      if (sortKey === 'timestamp') cmp = a.t - b.t;
      else if (sortKey === 'users') cmp = a.users - b.users;
      else cmp = a.ms - b.ms;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [searched, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE));
  const clampedPage = Math.min(page, pageCount - 1);
  const slice = sorted.slice(clampedPage * PAGE, clampedPage * PAGE + PAGE);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir(k === 'timestamp' ? 'desc' : 'asc');
    }
    setPage(0);
  }

  const arrow = (k: SortKey) => (k === sortKey ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  return (
    <>
      <PageHead
        title="Data Table"
        desc={`${fmtInt(searched.length)} of ${fmtInt(filtered.length)} measurements in view`}
      />

      <Panel
        title="Measurements"
        desc="Sortable · searchable · paginated"
        right={
          <div className="btn-row">
            <input
              className="control"
              placeholder="Search…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              style={{ width: 160 }}
            />
            <button className="btn" onClick={() => download(`loading_times_filtered_${stamp}.csv`, toCsv(sorted), 'text/csv')}>
              CSV
            </button>
            <button
              className="btn"
              onClick={() => download(`loading_times_filtered_${stamp}.json`, toJson(sorted, filter, summarize(sorted.map((r) => r.ms))), 'application/json')}
            >
              JSON
            </button>
            <button className="btn" onClick={() => download(`loading_times_report_${stamp}.md`, toMarkdown(sorted, filter), 'text/markdown')}>
              Markdown
            </button>
          </div>
        }
      >
        <div className="table-wrap" style={{ maxHeight: '58vh' }}>
          <table className="data">
            <thead>
              <tr>
                <th onClick={() => toggleSort('timestamp')}>Timestamp (UTC){arrow('timestamp')}</th>
                <th onClick={() => toggleSort('users')} className="num">Users{arrow('users')}</th>
                <th onClick={() => toggleSort('ms')} className="num">Avg load time (ms){arrow('ms')}</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((r, i) => (
                <tr key={`${r.timestamp}-${i}`}>
                  <td>{r.timestamp}</td>
                  <td className="num">{r.users}</td>
                  <td className="num">{r.ms.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {slice.length === 0 && (
                <tr>
                  <td colSpan={3} className="faint" style={{ textAlign: 'center', padding: 24 }}>
                    No rows match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button className="btn" disabled={clampedPage === 0} onClick={() => setPage(clampedPage - 1)}>
            ‹ Prev
          </button>
          <span className="muted" style={{ fontSize: 13 }}>
            Page {clampedPage + 1} / {pageCount}
          </span>
          <button className="btn" disabled={clampedPage >= pageCount - 1} onClick={() => setPage(clampedPage + 1)}>
            Next ›
          </button>
        </div>
      </Panel>
    </>
  );
}
