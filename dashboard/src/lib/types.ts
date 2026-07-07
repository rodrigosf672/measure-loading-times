// ---------------------------------------------------------------------------
// Data model
//
// The source of truth is the repo's `loading_times.csv`, produced UNCHANGED by
// the existing Playwright measurement script + hourly GitHub Action. It has
// exactly three columns:
//
//   Timestamp          ISO-8601 UTC instant of the measurement
//   Users              concurrency level (number of concurrent browsers, 1..N)
//   Avg_Loading_Time   average wall-clock page-load time in milliseconds
//
// The dashboard NEVER changes how these are collected. It only derives
// convenience fields (hour/day/month/etc.) from the timestamp for display.
// ---------------------------------------------------------------------------

/** A single raw row as it exists in loading_times.csv. */
export interface RawRow {
  Timestamp: string;
  Users: number;
  Avg_Loading_Time: number;
}

/** A parsed measurement enriched with derived time fields (read-only display aids). */
export interface Measurement {
  /** Original ISO timestamp string, unchanged. */
  timestamp: string;
  /** Epoch milliseconds parsed from the timestamp. */
  t: number;
  /** Concurrency level (Users column), unchanged. */
  users: number;
  /** Average loading time in ms (Avg_Loading_Time column), unchanged. */
  ms: number;
  // ---- derived, display-only fields ----
  /** 0 (Sunday) .. 6 (Saturday), local time. */
  dayOfWeek: number;
  /** 0..23 hour of day, local time. */
  hour: number;
  /** 1..12 month. */
  month: number;
  /** Full year, e.g. 2026. */
  year: number;
  /** YYYY-MM-DD day key (local). */
  dayKey: string;
}

/** Summary statistics over a set of loading-time values. */
export interface Stats {
  count: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  std: number;
}

/** Time-bucket granularity for aggregation. */
export type Granularity = 'raw' | 'hour' | 'day' | 'week' | 'month';

/** Active global filter state shared across all views. */
export interface FilterState {
  /** Inclusive start epoch ms, or null for open-ended. */
  from: number | null;
  /** Inclusive end epoch ms, or null for open-ended. */
  to: number | null;
  /** Selected concurrency levels; empty set means "all". */
  users: number[];
  /** Aggregation granularity for time-series style views. */
  granularity: Granularity;
}
