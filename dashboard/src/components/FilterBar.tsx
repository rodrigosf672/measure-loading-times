import { useFilters } from '../hooks/useFilters';
import type { Granularity } from '../lib/types';

const DAY_MS = 86_400_000;

function toDateInput(t: number | null, fallback: number): string {
  const d = new Date(t ?? fallback);
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function fromDateInput(v: string, endOfDay = false): number | null {
  if (!v) return null;
  const [y, m, d] = v.split('-').map(Number);
  const date = new Date(y, m - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return date.getTime();
}

const GRANULARITIES: Granularity[] = ['raw', 'hour', 'day', 'week', 'month'];
const PRESETS: { label: string; days: number | null }[] = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: null },
];

export function FilterBar() {
  const { filter, extent, userLevels, setRange, toggleUser, setUsers, setGranularity } = useFilters();
  if (!extent) return null;
  const [min, max] = extent;

  function applyPreset(days: number | null) {
    if (days == null) {
      setRange(null, null);
    } else {
      setRange(max - days * DAY_MS, max);
    }
  }

  // Which preset (if any) is currently active.
  const activePreset = (() => {
    if (filter.from == null && filter.to == null) return 'All';
    if (filter.to === max) {
      const span = max - (filter.from ?? min);
      for (const p of PRESETS) {
        if (p.days != null && Math.abs(span - p.days * DAY_MS) < DAY_MS / 2) return p.label;
      }
    }
    return null;
  })();

  const allUsersActive = filter.users.length === 0;

  return (
    <div className="filterbar">
      <div className="filter-group">
        <span className="filter-label">Range</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`preset-btn${activePreset === p.label ? ' active' : ''}`}
            onClick={() => applyPreset(p.days)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="filter-group">
        <input
          type="date"
          className="control"
          value={toDateInput(filter.from, min)}
          min={toDateInput(min, min)}
          max={toDateInput(max, max)}
          onChange={(e) => setRange(fromDateInput(e.target.value), filter.to)}
        />
        <span className="faint">→</span>
        <input
          type="date"
          className="control"
          value={toDateInput(filter.to, max)}
          min={toDateInput(min, min)}
          max={toDateInput(max, max)}
          onChange={(e) => setRange(filter.from, fromDateInput(e.target.value, true))}
        />
      </div>

      <div className="filter-group">
        <span className="filter-label">Users</span>
        <div className="seg">
          <button className={allUsersActive ? 'active' : ''} onClick={() => setUsers([])}>
            All
          </button>
          {userLevels.map((u) => (
            <button
              key={u}
              className={filter.users.includes(u) ? 'active' : ''}
              onClick={() => toggleUser(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-label">Bucket</span>
        <select
          className="control"
          value={filter.granularity}
          onChange={(e) => setGranularity(e.target.value as Granularity)}
        >
          {GRANULARITIES.map((g) => (
            <option key={g} value={g}>
              {g === 'raw' ? 'Raw points' : g[0].toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
