# PerfScope — Technical Design

PerfScope is a static, client-side dashboard that visualizes the loading-time
data produced by this repo's existing Playwright measurement script. It is
**additive**: it does not change how measurements are collected, and it does not
modify any existing file in the repository.

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  EXISTING (unchanged)                                                 │
│                                                                       │
│  measureLoadingTime.spec.ts ──►  loading_times.csv                    │
│  (Playwright, hourly GitHub Action)   (append-only log at repo root)  │
└───────────────────────────────────────────────┬─────────────────────┘
                                                 │  read-only copy
                                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NEW (dashboard/ subfolder)                                          │
│                                                                       │
│  scripts/copy-data.mjs  ──►  public/data/loading_times.csv           │
│                                        │                              │
│                                        ▼ fetch() at runtime           │
│  React SPA (Vite + TypeScript)                                        │
│    lib/       parse · stats · aggregate · histogram · exporters       │
│    hooks/     useFilters  (global filter context)                     │
│    components/ FilterBar · StatCards · Panel                          │
│    views/     Overview · TimeSeries · Distribution · Concurrency ·    │
│               Temporal · Table · Report                               │
│    charts     Recharts                                                │
└─────────────────────────────────────────────────────────────────────┘
```

There is **no backend, no database, and no server process**. The entire
dashboard is a static bundle (HTML + JS + CSS) plus the CSV, which makes it
trivially deployable to GitHub Pages, Netlify, an S3 bucket, or an Nginx
container.

### Why static / client-side?

The source data is a single append-only CSV that already lives in the repo and
is refreshed by an existing hourly GitHub Action. A server would add operational
weight without adding capability: all filtering, aggregation, and statistics run
comfortably in the browser for the current data volume (tens of thousands of
rows). Keeping it static also means the "live" deployment updates automatically
whenever the measurement action commits a new CSV and the Pages workflow
redeploys.

---

## 2. Data model

The single source of truth is `loading_times.csv` at the repo root. It has three
positional columns and (in this repo) **no header row**:

| Column | Type | Meaning |
| --- | --- | --- |
| `Timestamp` | ISO-8601 UTC string | Instant the measurement batch was recorded |
| `Users` | integer | Concurrency level = number of concurrent browser instances (1–5) |
| `Avg_Loading_Time` | float (ms) | Average wall-clock page-load time for that batch |

`Avg_Loading_Time` is measured exactly as the original script does it:
`Date.now()` immediately before `page.goto(url)` minus `Date.now()` immediately
after it resolves, averaged over the iterations of a batch. **PerfScope does not
recompute or alter this value.**

### Derived (display-only) fields

At load time each row is enriched with fields derived purely from `Timestamp`,
used only for grouping and never persisted back:

`t` (epoch ms) · `hour` (0–23) · `dayOfWeek` (0–6) · `month` (1–12) ·
`year` · `dayKey` (YYYY-MM-DD).

### Parsing robustness

The parser (`lib/data.ts → parseCsv`) reads columns **positionally** rather than
by header name, and skips a leading line only if its first field is not a
parseable date. This means it works whether the CSV has a header or not — the
repo's file has none, but the measurement script's file-creation path can emit a
`Timestamp,Users,Avg_Loading_Time` header, and both cases parse correctly.

---

## 3. "Live" mechanism

PerfScope is a **visualization** layer, so "live" means *always reflecting the
latest committed data*, not streaming a currently-running test:

1. The existing hourly GitHub Action runs the Playwright script and commits new
   rows to `loading_times.csv`.
2. The GitHub Pages deploy workflow (`.github/workflows/pages.yml`) rebuilds the
   dashboard, and its `prebuild` step copies the freshest CSV into the bundle.
3. Visitors always load the most recent snapshot.

For local exploration, `npm run dev` runs the same copy step and Vite serves the
SPA with hot-reload. Re-running `npm run copy-data` refreshes the local snapshot
from the repo root.

> The upstream measurement script and its data-collection GitHub Action are left
> completely untouched. Adding true per-request streaming (SSE/WebSocket) would
> require changing the measurement layer, which is explicitly out of scope.

---

## 4. Metrics & statistics

All statistics are computed client-side over whatever subset the global filter
selects (`lib/stats.ts`):

- **count, mean, median (p50), p95, p99, min, max, sample standard deviation**
- Percentiles use linear interpolation between closest ranks (numpy's default
  `method="linear"` / R type 7). The implementation is verified to match numpy
  to the digit on the real dataset.
- **Aggregation** (`lib/aggregate.ts`) buckets rows by hour/day/week/month and
  computes mean / median / p95 per bucket, optionally split by concurrency
  level.
- **Histogram** (`lib/histogram.ts`) bins load times into equal-width buckets.
- **Regression interpretation** (`lib/exporters.ts → interpret`) compares the
  most recent 20% of the selected window against the earliest 20%; a move of
  ≥ 10% in mean flags *degraded* / *improved*, otherwise *stable*. This is a
  transparent heuristic over the data we have, not a statistical hypothesis
  test.

### Status colors

Color is reserved for status signaling, never decoration:

| Status | Color | Used when |
| --- | --- | --- |
| normal | green | tail within expected range / scales cleanly |
| warning | amber | mild tail inflation or slowdown under load |
| regression | orange | p95/p99 far above median, or degraded trend |
| failure | red | reserved for load/parse failures |

---

## 5. Views

| View | Question it answers |
| --- | --- |
| **Overview** | What's the headline — counts, percentiles, trend, and load by concurrency at a glance? |
| **Time Series** | How does load time move over time (combined, or split per concurrency level; mean/median/p95)? |
| **Distribution** | How are load times spread; how does spread differ by concurrency? |
| **By Concurrency** | How does load time respond as concurrent users increase (1→5)? |
| **Temporal Patterns** | When are pages slow — by hour of day, day of week, month? |
| **Data Table** | Inspect/sort/search the raw rows; export the current selection. |
| **Report & Export** | Auto-generated summary + interpretation; export CSV/JSON/Markdown. |

All views subscribe to one shared global filter (date range, concurrency
selection, aggregation granularity) via `useFilters`.

---

## 6. Limitations

- **Single metric.** The upstream script records only average page-load time per
  batch, so richer web-vitals (FCP, LCP, DOMContentLoaded, request counts, JS
  errors, status codes) are not available. The UI is structured so these could
  be added later *if* the measurement layer starts recording them — but doing so
  is deliberately out of scope here.
- **Batch averages, not per-navigation samples.** Each CSV row is already an
  average over a batch's iterations, so intra-batch variance is not recoverable.
- **Client-side scale.** Everything runs in the browser. Tens of thousands of
  rows are fine; millions would warrant precomputed aggregates or a query
  backend.
- **Regression flag is heuristic**, not a significance test.
- **Timezone.** Derived hour/day/month fields use the viewer's local timezone;
  the raw timestamps are UTC.
