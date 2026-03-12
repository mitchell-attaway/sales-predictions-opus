'use client';

import { useState, useMemo } from 'react';
import { WorkingRateData } from '@/lib/working-rate/types';
import { formatCurrency, formatHours, formatRate } from '@/lib/working-rate/utils';
import { RateBadge } from './Badge';

interface WorkingRateTableProps {
  data: WorkingRateData[];
  showDirector?: boolean;
}

type SortKey = 'partnerName' | 'marketingDirector' | 'monthlyInvoice' | 'totalHours' | 'workingRate';
type SortDir = 'asc' | 'desc';

export function WorkingRateTable({ data, showDirector = true }: WorkingRateTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('workingRate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return data;
    const lower = search.toLowerCase();
    return data.filter(
      (d) =>
        d.partnerName.toLowerCase().includes(lower) ||
        d.marketingDirector.toLowerCase().includes(lower),
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <span className="text-gray-300 ml-1">&uarr;&darr;</span>;
    return <span className="text-brand-red ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  }

  function exportCsv() {
    const headers = ['Partner Name', showDirector ? 'Marketing Director' : '', 'Monthly Invoice', 'Hours', 'Working Rate']
      .filter(Boolean)
      .join(',');
    const rows = sorted.map((d) =>
      [
        `"${d.partnerName}"`,
        showDirector ? `"${d.marketingDirector}"` : '',
        d.monthlyInvoice,
        d.totalHours.toFixed(1),
        d.workingRate.toFixed(2),
      ]
        .filter((_, i) => showDirector || i !== 1)
        .join(','),
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'working-rates.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-xs font-sans font-bold text-brand-navy/50 uppercase tracking-wider">
          Working Rates
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search partners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 text-xs font-sans border border-gray-200 rounded-lg w-56 focus:outline-none focus:border-brand-red/30"
            />
          </div>
          <button
            onClick={exportCsv}
            className="px-3 py-2 text-xs font-sans font-medium text-brand-navy bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th
                onClick={() => toggleSort('partnerName')}
                className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider cursor-pointer hover:text-brand-navy"
              >
                Partner <SortIcon column="partnerName" />
              </th>
              {showDirector && (
                <th
                  onClick={() => toggleSort('marketingDirector')}
                  className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider cursor-pointer hover:text-brand-navy"
                >
                  Director <SortIcon column="marketingDirector" />
                </th>
              )}
              <th
                onClick={() => toggleSort('monthlyInvoice')}
                className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider cursor-pointer hover:text-brand-navy text-right"
              >
                Monthly Invoice <SortIcon column="monthlyInvoice" />
              </th>
              <th
                onClick={() => toggleSort('totalHours')}
                className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider cursor-pointer hover:text-brand-navy text-right"
              >
                Hours <SortIcon column="totalHours" />
              </th>
              <th
                onClick={() => toggleSort('workingRate')}
                className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider cursor-pointer hover:text-brand-navy text-right"
              >
                Working Rate <SortIcon column="workingRate" />
              </th>
              <th className="px-4 py-3 text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => (
              <tr
                key={d.partnerId}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <a
                    href={`/working-rate/partners/${d.partnerId}`}
                    className="text-sm font-sans font-medium text-brand-navy hover:text-brand-red transition-colors"
                  >
                    {d.partnerName}
                  </a>
                </td>
                {showDirector && (
                  <td className="px-4 py-3">
                    <a
                      href={`/working-rate/directors/${encodeURIComponent(d.marketingDirector)}`}
                      className="text-xs font-serif text-gray-600 hover:text-brand-red transition-colors"
                    >
                      {d.marketingDirector || 'Unassigned'}
                    </a>
                  </td>
                )}
                <td className="px-4 py-3 text-sm font-serif text-right text-brand-navy">
                  {formatCurrency(d.monthlyInvoice)}
                </td>
                <td className="px-4 py-3 text-sm font-serif text-right text-brand-navy">
                  {d.totalHours > 0 ? formatHours(d.totalHours) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-sans font-bold text-right text-brand-navy">
                  {d.workingRate > 0 ? formatRate(d.workingRate) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <RateBadge rate={d.workingRate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="py-8 text-center text-sm font-serif text-gray-400">
          No partners found
        </div>
      )}
    </div>
  );
}
