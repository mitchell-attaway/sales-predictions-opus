'use client';

import { useState } from 'react';
import { Header } from './Header';
import { KpiCards } from './KpiCards';
import { YtdSection } from './YtdSection';
import { PipelineCharts } from './PipelineCharts';
import { PipelineTable } from './PipelineTable';
import { ActualsTable } from './ActualsTable';
import { InsightsStrip } from './InsightsStrip';
import { useDashboardData } from '@/hooks/useDashboardData';
import { getCurrentMonth } from '@/config/monthTabs';

export function Dashboard() {
  const [month, setMonth] = useState(getCurrentMonth);
  const { monthly, topSheet, loading, error, fetchedAt, refetch } = useDashboardData(month);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <Header
        selectedMonth={month}
        onMonthChange={setMonth}
        fetchedAt={fetchedAt}
        onRefresh={refetch}
        loading={loading}
      />

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/10 p-4">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Warnings */}
        {monthly?.warnings && monthly.warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10 p-4">
            {monthly.warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber-700 dark:text-amber-300">{w}</p>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !monthly && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border h-28" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border h-80" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        {monthly && <KpiCards data={monthly} />}

        {/* YTD Plan vs Actual */}
        {topSheet && <YtdSection data={topSheet} currentMonth={month} />}

        {/* Pipeline Charts */}
        {monthly && monthly.pipeline.length > 0 && (
          <PipelineCharts pipeline={monthly.pipeline} />
        )}

        {/* Insights Strip */}
        {monthly && monthly.pipeline.length > 0 && (
          <InsightsStrip pipeline={monthly.pipeline} />
        )}

        {/* Pipeline Table */}
        {monthly && <PipelineTable pipeline={monthly.pipeline} />}

        {/* Actuals Table */}
        {monthly && (
          <ActualsTable actuals={monthly.actuals} actualsDetected={monthly.actualsDetected} />
        )}

        {/* Footer */}
        <footer className="pt-4 pb-8 border-t text-center" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Harbinger Sales Pipeline Dashboard &middot; Data sourced from Google Sheets &middot; Refreshes every 5 minutes
          </p>
        </footer>
      </main>
    </div>
  );
}
