// Shared visual constants for Recharts so all views look consistent.
export const CHART = {
  grid: '#232c3d',
  axis: '#6b7891',
  axisLine: '#303b52',
  text: '#9aa7bd',
  accent: '#4aa8ff',
  tooltipBg: '#1a2130',
  tooltipBorder: '#303b52',
};

export const STATUS_COLORS = {
  normal: '#37d39a',
  warning: '#f5b74a',
  regression: '#ff7a59',
  failure: '#ef4d5a',
};

/** Neutral per-concurrency series colors, indexed by Users level (1..5+). */
const SERIES = ['#4aa8ff', '#7c8cf8', '#b078f0', '#e072c4', '#f59e7a', '#37d39a', '#f5b74a'];
export function seriesColor(usersLevel: number): string {
  return SERIES[(usersLevel - 1) % SERIES.length];
}

export const tooltipStyle = {
  background: CHART.tooltipBg,
  border: `1px solid ${CHART.tooltipBorder}`,
  borderRadius: 8,
  fontSize: 12.5,
  color: '#e6ecf5',
} as const;

export const tooltipItemStyle = { color: '#e6ecf5' } as const;
export const tooltipLabelStyle = { color: '#9aa7bd', marginBottom: 4 } as const;
