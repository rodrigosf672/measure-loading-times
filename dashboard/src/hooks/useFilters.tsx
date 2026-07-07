import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { FilterState, Granularity, Measurement } from '../lib/types';
import { applyFilter } from '../lib/data';

interface FilterContextValue {
  /** All measurements (unfiltered), sorted by time. */
  all: Measurement[];
  /** Current filter state. */
  filter: FilterState;
  /** Rows after applying the current filter. */
  filtered: Measurement[];
  /** Full time extent [min,max] of the unfiltered data. */
  extent: [number, number] | null;
  /** Concurrency levels present in the data. */
  userLevels: number[];
  setFrom: (t: number | null) => void;
  setTo: (t: number | null) => void;
  setRange: (from: number | null, to: number | null) => void;
  toggleUser: (u: number) => void;
  setUsers: (u: number[]) => void;
  setGranularity: (g: Granularity) => void;
  reset: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

interface ProviderProps {
  all: Measurement[];
  extent: [number, number] | null;
  userLevels: number[];
  children: ReactNode;
}

export function FilterProvider({ all, extent, userLevels, children }: ProviderProps) {
  const [filter, setFilter] = useState<FilterState>({
    from: null,
    to: null,
    users: [],
    granularity: 'day',
  });

  const filtered = useMemo(() => applyFilter(all, filter), [all, filter]);

  const value: FilterContextValue = {
    all,
    filter,
    filtered,
    extent,
    userLevels,
    setFrom: (t) => setFilter((f) => ({ ...f, from: t })),
    setTo: (t) => setFilter((f) => ({ ...f, to: t })),
    setRange: (from, to) => setFilter((f) => ({ ...f, from, to })),
    toggleUser: (u) =>
      setFilter((f) => ({
        ...f,
        users: f.users.includes(u) ? f.users.filter((x) => x !== u) : [...f.users, u].sort((a, b) => a - b),
      })),
    setUsers: (u) => setFilter((f) => ({ ...f, users: [...u].sort((a, b) => a - b) })),
    setGranularity: (g) => setFilter((f) => ({ ...f, granularity: g })),
    reset: () => setFilter({ from: null, to: null, users: [], granularity: 'day' }),
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
  return ctx;
}
