'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useWorkingRates } from '@/hooks/useWorkingRates';
import { getDateRangePresets, formatCurrency, formatHours, formatRate } from '@/lib/working-rate/utils';
import { DateRangePicker } from '@/components/working-rate/DateRangePicker';
import { MetricCard } from '@/components/working-rate/MetricCard';
import { WorkingRateTable } from '@/components/working-rate/WorkingRateTable';
import { LoadingSkeleton } from '@/components/working-rate/LoadingSpinner';
import { EmptyState } from '@/components/working-rate/EmptyState';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#03293A', '#FF1E00', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DirectorDetailPage() {
  const params = useParams();
  const directorName = decodeURIComponent(params.name as string);

  const presets = getDateRangePresets();
  const [from, setFrom] = useState(presets[0].from);
  const [to, setTo] = useState(presets[0].to);

  const { data, loading, error } = useWorkingRates(from, to, directorName);

  const director = useMemo(() => {
    if (!data) return null;
    return data.directors.find(
      (d) => d.name.toLowerCase() === directorName.toLowerCase(),
    );
  }, [data, directorName]);

  const barData = useMemo(() => {
    if (!director) return [];
    return [...director.clients]
      .sort((a, b) => b.workingRate - a.workingRate)
      .map((c) => ({
        name: c.partnerName.length > 20 ? c.partnerName.slice(0, 18) + '...' : c.partnerName,
        rate: Math.round(c.workingRate),
      }));
  }, [director]);

  const pieData = useMemo(() => {
    if (!director) return [];
    return director.clients.map((c) => ({
      name: c.partnerName,
      value: c.monthlyInvoice,
    }));
  }, [director]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <a
              href="/working-rate/directors"
              className="text-xs font-sans text-brand-red hover:text-brand-red-hover transition-colors"
            >
              Directors
            </a>
            <span className="text-xs text-gray-300">/</span>
          </div>
          <h1 className="text-[40px] font-sans font-bold text-brand-navy leading-tight">
            {directorName}
          </h1>
          <p className="text-sm font-serif text-gray-500 mt-1">
            Marketing Director
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

      {!loading && !error && director && (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Active Clients"
              value={String(director.clientCount)}
            />
            <MetricCard
              label="Average Working Rate"
              value={formatRate(director.averageWorkingRate)}
              subtitle="per hour (weighted)"
            />
            <MetricCard
              label="Total Hours"
              value={formatHours(director.totalHours)}
            />
            <MetricCard
              label="Total Invoice Value"
              value={formatCurrency(director.totalInvoiceValue)}
            />
          </div>

          {/* Client Working Rates Table */}
          <WorkingRateTable data={director.clients} showDirector={false} />

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Bar chart: client working rates */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-sans font-bold text-brand-navy/50 uppercase tracking-wider mb-1">
                Client Working Rates
              </h3>
              <div className="h-0.5 w-8 bg-brand-red rounded-full mb-4" />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fontFamily: 'Inter' }}
                      stroke="#9ca3af"
                      tickFormatter={(v) => `$${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11, fontFamily: 'Inter' }}
                      stroke="#9ca3af"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        fontSize: 12,
                        fontFamily: 'Inter',
                      }}
                      formatter={(value) => [`$${value}/hr`, 'Rate']}
                    />
                    <Bar dataKey="rate" fill="#03293A" radius={[0, 6, 6, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie chart: invoice distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xs font-sans font-bold text-brand-navy/50 uppercase tracking-wider mb-1">
                Invoice Distribution
              </h3>
              <div className="h-0.5 w-8 bg-brand-red rounded-full mb-4" />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      paddingAngle={2}
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${(name ?? '').length > 15 ? (name ?? '').slice(0, 13) + '...' : name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        fontSize: 12,
                        fontFamily: 'Inter',
                      }}
                      formatter={(value) => [formatCurrency(value as number), 'Monthly Invoice']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && !error && !director && (
        <EmptyState
          title="Director not found"
          description={`No data found for "${directorName}" in the selected period.`}
        />
      )}
    </div>
  );
}
