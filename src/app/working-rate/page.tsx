'use client';

import { useState } from 'react';
import { useWorkingRates } from '@/hooks/useWorkingRates';
import { getDateRangePresets } from '@/lib/working-rate/utils';
import { formatCurrency, formatHours, formatRate } from '@/lib/working-rate/utils';
import { DateRangePicker } from '@/components/working-rate/DateRangePicker';
import { MetricCard } from '@/components/working-rate/MetricCard';
import { WorkingRateTable } from '@/components/working-rate/WorkingRateTable';
import { RateDistributionChart } from '@/components/working-rate/RateDistributionChart';
import { TopPartnersChart } from '@/components/working-rate/TopPartnersChart';
import { LoadingSkeleton } from '@/components/working-rate/LoadingSpinner';
import { EmptyState } from '@/components/working-rate/EmptyState';

export default function WorkingRateDashboard() {
  const presets = getDateRangePresets();
  const [from, setFrom] = useState(presets[0].from);
  const [to, setTo] = useState(presets[0].to);

  const { data, unmatchedPartners, loading, error } = useWorkingRates(from, to);

  function handleDateChange(newFrom: string, newTo: string) {
    setFrom(newFrom);
    setTo(newTo);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-sans font-bold text-brand-navy leading-tight">
            Working Rate Dashboard
          </h1>
          <p className="text-sm font-serif text-gray-500 mt-1">
            Effective hourly rates across all client partnerships
          </p>
        </div>
        <DateRangePicker from={from} to={to} onChange={handleDateChange} />
      </div>

      {/* Unmatched partners warning */}
      {unmatchedPartners.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-sans font-medium text-amber-800">
              {unmatchedPartners.length} unmatched partner{unmatchedPartners.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs font-serif text-amber-600 mt-0.5">
              {unmatchedPartners.join(', ')} — add mappings in partner-mapping.json
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-sans font-medium text-red-800">
            Failed to load data
          </p>
          <p className="text-xs font-serif text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && <LoadingSkeleton />}

      {/* Data loaded */}
      {!loading && !error && data && (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Active Partners"
              value={String(data.totals.totalPartners)}
            />
            <MetricCard
              label="Average Working Rate"
              value={formatRate(data.totals.overallWorkingRate)}
              subtitle="per hour"
            />
            <MetricCard
              label="Total Hours Tracked"
              value={formatHours(data.totals.totalHours)}
              subtitle={`${data.period.months} month${data.period.months !== 1 ? 's' : ''}`}
            />
            <MetricCard
              label="Total Invoice Value"
              value={formatCurrency(data.totals.totalInvoiceValue)}
              subtitle={`${data.period.months} month${data.period.months !== 1 ? 's' : ''} combined`}
            />
          </div>

          {/* Working Rate Table */}
          {data.partners.length > 0 ? (
            <WorkingRateTable data={data.partners} />
          ) : (
            <EmptyState
              title="No partner data"
              description="No active partners found for the selected period. Check your Airtable and Harvest configurations."
            />
          )}

          {/* Charts */}
          {data.partners.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <RateDistributionChart
                data={data.partners}
                averageRate={data.totals.overallWorkingRate}
              />
              <div /> {/* Spacer for grid alignment */}
            </div>
          )}

          {data.partners.length > 0 && (
            <TopPartnersChart data={data.partners} />
          )}
        </>
      )}

      {!loading && !error && !data && (
        <EmptyState
          title="No data available"
          description="Select a date range to view working rates."
        />
      )}
    </div>
  );
}
