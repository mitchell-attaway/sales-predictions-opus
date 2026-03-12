'use client';

import { useState, useMemo } from 'react';
import { useWorkingRates } from '@/hooks/useWorkingRates';
import { getDateRangePresets, formatCurrency, formatHours, formatRate } from '@/lib/working-rate/utils';
import { DateRangePicker } from '@/components/working-rate/DateRangePicker';
import { MDSummaryCard } from '@/components/working-rate/MDSummaryCard';
import { LoadingSkeleton } from '@/components/working-rate/LoadingSpinner';
import { EmptyState } from '@/components/working-rate/EmptyState';
import { RateBadge } from '@/components/working-rate/Badge';

export default function DirectorsPage() {
  const presets = getDateRangePresets();
  const [from, setFrom] = useState(presets[0].from);
  const [to, setTo] = useState(presets[0].to);

  const { data, loading, error } = useWorkingRates(from, to);

  const sortedDirectors = useMemo(() => {
    if (!data) return [];
    return [...data.directors].sort(
      (a, b) => b.averageWorkingRate - a.averageWorkingRate,
    );
  }, [data]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-sans font-bold text-brand-navy leading-tight">
            Marketing Directors
          </h1>
          <p className="text-sm font-serif text-gray-500 mt-1">
            Working rate performance by director
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

      {loading && <LoadingSkeleton />}

      {!loading && !error && data && (
        <>
          {/* Summary Cards Grid */}
          {sortedDirectors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedDirectors.map((director) => (
                <MDSummaryCard key={director.name} director={director} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No directors found"
              description="No marketing director data available for the selected period."
            />
          )}

          {/* Ranking Table */}
          {sortedDirectors.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-xs font-sans font-bold text-brand-navy/50 uppercase tracking-wider">
                  Director Rankings
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider w-12">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider">
                        Director
                      </th>
                      <th className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider text-center">
                        Clients
                      </th>
                      <th className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider text-right">
                        Total Invoice
                      </th>
                      <th className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider text-right">
                        Total Hours
                      </th>
                      <th className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider text-right">
                        Avg Rate
                      </th>
                      <th className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider text-center">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDirectors.map((d, i) => (
                      <tr key={d.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-sans font-bold text-brand-navy/30">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`/working-rate/directors/${encodeURIComponent(d.name)}`}
                            className="text-sm font-sans font-medium text-brand-navy hover:text-brand-red transition-colors"
                          >
                            {d.name}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-sm font-serif text-brand-navy text-center">
                          {d.clientCount}
                        </td>
                        <td className="px-4 py-3 text-sm font-serif text-brand-navy text-right">
                          {formatCurrency(d.totalInvoiceValue)}
                        </td>
                        <td className="px-4 py-3 text-sm font-serif text-brand-navy text-right">
                          {formatHours(d.totalHours)}
                        </td>
                        <td className="px-4 py-3 text-sm font-sans font-bold text-brand-navy text-right">
                          {formatRate(d.averageWorkingRate)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <RateBadge rate={d.averageWorkingRate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
