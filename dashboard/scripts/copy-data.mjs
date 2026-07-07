// Copies the repo's loading_times.csv into the dashboard's public/ folder so the
// static site can fetch it. This is READ-ONLY with respect to the source CSV:
// the file at the repo root (../loading_times.csv) is the single source of truth
// produced by the existing Playwright measurement + hourly GitHub Action, and is
// never modified by the dashboard. If the source is missing, we fall back to a
// tiny built-in sample so `npm run dev` still works.
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const repoRoot = resolve(projectRoot, '..');

const source = resolve(repoRoot, 'loading_times.csv');
const outDir = resolve(projectRoot, 'public', 'data');
const dest = resolve(outDir, 'loading_times.csv');

mkdirSync(outDir, { recursive: true });

if (existsSync(source)) {
  copyFileSync(source, dest);
  console.log(`[copy-data] Copied ${source} -> ${dest}`);
} else {
  const sample = [
    'Timestamp,Users,Avg_Loading_Time',
    '2025-03-16T17:18:42.752Z,1,1333.2',
    '2025-03-16T17:18:50.583Z,2,1349.2',
    '2025-03-16T17:18:58.508Z,3,1302.2',
    '2025-03-16T17:19:06.576Z,4,1289.8',
    '2025-03-16T17:19:15.437Z,5,1396.36',
    '',
  ].join('\n');
  writeFileSync(dest, sample, 'utf8');
  console.warn(
    `[copy-data] Source CSV not found at ${source}; wrote a tiny sample to ${dest}.`,
  );
}
