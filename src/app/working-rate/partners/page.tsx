'use client';

import { useState, useMemo } from 'react';
import { useWorkingRates } from '@/hooks/useWorkingRates';
import { getDateRangePresets } from '@/lib/working-rate/utils';
import { DateRangePicker } from '@/components/working-rate/DateRangePicker';
import { WorkingRateTable } from '@/components/working-rate/WorkingRateTable';
import { LoadingSkeleton } from '@/components/working-rate/LoadingSpinner';
import { EmptyState } from '@/components/working-rate/EmptyState';

export default function PartnersPage() {
  const presets = getDateRangePresets();
  const [from, setFrom] = useState(presets[0].from);
  const [to, setTo] = useState(presets[0].to);
  const [filterDirector, setFilterDirector] = useState('');
  const [filterMinRate, setFilterMinRate] = useState('');
  const [filterMaxRate, setFilterMaxRate] = useState('');

  const { data, loading, error } = useWorkingRates(from, to);

  const directors = useMemo(() => {
    if (!data) return [];
    const names = new Set(data.partners.map((p) => p.marketingDirector).filter(Boolean));
    return Array.from(names).sort();
  }, [data]);

  const filteredPartners = useMemo(() => {
    if (!data) return [];
    let result = data.partners;

    if (filterDirector) {
      result = result.filter((p) => p.marketingDirector === filterDirector);
    }
    if (filterMinRate) {
      const min = parseFloat(filterMinRate);
      if (!isNaN(min)) result = result.filter((p) => p.workingRate >= min);
    }
    if (filterMaxRate) {
      const max = parseFloat(filterMaxRate);
      if (!isNaN(max)) result = result.filter((p) => p.workingRate <= max || p.workingRate === 0);
    }

    return result;
  }, [data, filterDirector, filterMinRate, filterMaxRate]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-sans font-bold text-brand-navy leading-tight">
            All Partners
          </h1>
          <p className="text-sm font-serif text-gray-500 mt-1">
            Complete partner list with working rates
          </p>
        </div>
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-sans font-medium text-red-800">Failed to load data</p>
          <p className="text-xs font-serif text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {/* Filters */}
      {!loading && data && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterDirector}
            onChange={(e) => setFilterDirector(e.target.value)}
            className="px-3 py-2 text-xs font-sans border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-brand-red/30"
          >
            <option value="">All Directors</option>
            {directors.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <span className="text-xs font-sans text-gray-500">Rate:</span>
            <input
              type="number"
              placeholder="Min"
              value={filterMinRate}
              onChange={(e) => setFilterMinRate(e.target.value)}
              className="w-20 px-2 py-2 text-xs font-sans border border-gray-200 rounded-lg focus:outline-none focus:border-brand-red/30"
            />
            <span className="text-xs text-gray-400">—</span>
            <input
              type="number"
              placeholder="Max"
              value={filterMaxRate}
              onChange={(e) => setFilterMaxRate(e.target.value)}
              className="w-20 px-2 py-2 text-xs font-sans border border-gray-200 rounded-lg focus:outline-none focus:border-brand-red/30"
            />
          </div>

          {(filterDirector || filterMinRate || filterMaxRate) && (
            <button
              onClick={() => { setFilterDirector(''); setFilterMinRate(''); setFilterMaxRate(''); }}
              className="px-3 py-2 text-xs font-sans text-brand-red hover:text-brand-red-hover transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {!loading && !error && data && (
        filteredPartners.length > 0 ? (
          <WorkingRateTable data={filteredPartners} />
        ) : (
          <EmptyState
            title="No partners match"
            description="Try adjusting your filters or date range."
          />
        )
      )}
    </div>
  );
}
