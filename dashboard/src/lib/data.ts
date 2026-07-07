import Papa from 'papaparse';
import type { FilterState, Granularity, Measurement } from './types';

const DAY_MS = 86_400_000;

/** Resolve the data URL, honoring Vite's base path (works on GitHub Pages subpaths). */
export function dataUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base}data/loading_times.csv`.replace(/\/{2,}/g, '/');
}

/** Enrich a raw row with derived, display-only time fields. */
function enrich(timestamp: string, users: number, ms: number): Measurement | null {
  const t = Date.parse(timestamp);
  if (!Number.isFinite(t) || !Number.isFinite(users) || !Number.isFinite(ms)) return null;
  const d = new Date(t);
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return {
    timestamp,
    t,
    users,
    ms,
    dayOfWeek: d.getDay(),
    hour: d.getHours(),
    month: d.getMonth() + 1,
    year: yyyy,
    dayKey: `${yyyy}-${mm}-${dd}`,
  };
}

/**
 * Fetch and parse loading_times.csv into enriched measurements.
 * Rows that fail to parse (bad number, unparseable date) are dropped silently.
 */
export async function loadMeasurements(url = dataUrl()): Promise<Measurement[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch data (${res.status}) from ${url}`);
  const text = await res.text();
  return parseCsv(text);
}

/**
 * Parse loading_times.csv into enriched measurements.
 *
 * The CSV is POSITIONAL: column 0 = Timestamp, 1 = Users, 2 = Avg_Loading_Time.
 * The file in the repo has NO header row (it is a plain append log), but the
 * measurement script's `writeFileSync` path can emit a
 * `Timestamp,Users,Avg_Loading_Time` header on first creation. We therefore do
 * NOT use papaparse's `header:true` mode; instead we parse positionally and skip
 * a leading header line only if its first field is not a valid timestamp. Rows
 * that fail to parse are dropped silently.
 */
export function parseCsv(text: string): Measurement[] {
  const parsed = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  const out: Measurement[] = [];
  for (const row of parsed.data) {
    if (!row || row.length < 3) continue;
    const ts = (row[0] ?? '').trim();
    if (!ts) continue;
    // Skip a header row if present (first field not a parseable date).
    if (!Number.isFinite(Date.parse(ts))) continue;
    const users = Number(row[1]);
    const ms = Number(row[2]);
    const m = enrich(ts, users, ms);
    if (m) out.push(m);
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}

/** Distinct concurrency levels present in the data, ascending. */
export function distinctUsers(rows: Measurement[]): number[] {
  return [...new Set(rows.map((r) => r.users))].sort((a, b) => a - b);
}

/** Min/max timestamp (epoch ms) across all rows; null if empty. */
export function timeExtent(rows: Measurement[]): [number, number] | null {
  if (rows.length === 0) return null;
  return [rows[0].t, rows[rows.length - 1].t];
}

/** Apply the global filter (date range + concurrency selection) to the rows. */
export function applyFilter(rows: Measurement[], f: FilterState): Measurement[] {
  const usersSet = f.users.length ? new Set(f.users) : null;
  return rows.filter((r) => {
    if (f.from != null && r.t < f.from) return false;
    if (f.to != null && r.t > f.to) return false;
    if (usersSet && !usersSet.has(r.users)) return false;
    return true;
  });
}

/** Truncate an epoch-ms instant to the start of its bucket for the given granularity. */
export function bucketStart(t: number, g: Granularity): number {
  const d = new Date(t);
  switch (g) {
    case 'hour':
      d.setMinutes(0, 0, 0);
      return d.getTime();
    case 'day':
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    case 'week': {
      d.setHours(0, 0, 0, 0);
      const dow = d.getDay(); // 0=Sun
      return d.getTime() - dow * DAY_MS;
    }
    case 'month':
      return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    case 'raw':
    default:
      return t;
  }
}

/** A generic grouping helper: returns a Map keyed by the key function. */
export function groupBy<K>(rows: Measurement[], keyFn: (m: Measurement) => K): Map<K, Measurement[]> {
  const map = new Map<K, Measurement[]>();
  for (const r of rows) {
    const k = keyFn(r);
    const arr = map.get(k);
    if (arr) arr.push(r);
    else map.set(k, [r]);
  }
  return map;
}

export const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
