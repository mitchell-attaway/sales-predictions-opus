'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { KpiCard } from './KpiCard';
import type { TopSheetData, YtdMetrics } from '@/types';
import { fmtCompact, fmtCurrency, fmtPercent, fmtNumber } from '@/lib/format';

interface YtdSectionProps {
  data: TopSheetData;
}

function computeYtd(data: TopSheetData): YtdMetrics {
  // Sum all months that have actual data (non-zero actual revenue)
  let ytdModeledRevenue = 0;
  let ytdActualRevenue = 0;
  let ytdModeledPartners = 0;
  let ytdActualPartners = 0;

  for (const m of data.months) {
    if (m.actualRevenue > 0 || m.modeledRevenue > 0) {
      ytdModeledRevenue += m.modeledRevenue;
      ytdActualRevenue += m.actualRevenue;
      ytdModeledPartners += m.modeledPartners;
      ytdActualPartners += m.actualPartners;
    }
  }

  const ytdVarianceDollars = ytdActualRevenue - ytdModeledRevenue;
  const ytdVariancePercent = ytdModeledRevenue > 0 ? ytdVarianceDollars / ytdModeledRevenue : 0;
  const ytdPartnersVariance = ytdActualPartners - ytdModeledPartners;

  return {
    ytdModeledRevenue,
    ytdActualRevenue,
    ytdVarianceDollars,
    ytdVariancePercent,
    ytdModeledPartners,
    ytdActualPartners,
    ytdPartnersVariance,
  };
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border p-3 text-xs shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' && entry.value > 100 ? fmtCurrency(entry.value) : fmtNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function YtdSection({ data }: YtdSectionProps) {
  const ytd = useMemo(() => computeYtd(data), [data]);

  const revenueChartData = data.months
    .filter((m) => m.modeledRevenue > 0 || m.actualRevenue > 0)
    .map((m) => ({
      month: m.month,
      Modeled: m.modeledRevenue,
      Actual: m.actualRevenue,
    }));

  const partnersChartData = data.months
    .filter((m) => m.modeledPartners > 0 || m.actualPartners > 0)
    .map((m) => ({
      month: m.month,
      Modeled: m.modeledPartners,
      Actual: m.actualPartners,
    }));

  const varianceTrend = ytd.ytdVarianceDollars >= 0 ? 'up' : 'down';

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        YTD Plan vs Actual
      </h2>

      {/* YTD KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="YTD Modeled Revenue" value={fmtCompact(ytd.ytdModeledRevenue)} />
        <KpiCard label="YTD Actual Revenue" value={fmtCompact(ytd.ytdActualRevenue)} />
        <KpiCard
          label="YTD Variance"
          value={fmtCompact(ytd.ytdVarianceDollars)}
          subtitle={fmtPercent(ytd.ytdVariancePercent)}
          trend={varianceTrend}
        />
        <KpiCard
          label="YTD Partners"
          value={`${fmtNumber(ytd.ytdActualPartners)} / ${fmtNumber(ytd.ytdModeledPartners)}`}
          subtitle={`${ytd.ytdPartnersVariance >= 0 ? '+' : ''}${fmtNumber(ytd.ytdPartnersVariance)} vs plan`}
          trend={ytd.ytdPartnersVariance >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue chart */}
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Monthly Revenue: Modeled vs Actual
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueChartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => fmtCompact(v)} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Modeled" fill="var(--color-brand-navy)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="var(--color-brand-red)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Partners chart */}
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Monthly Partners: Modeled vs Actual
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={partnersChartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Modeled" fill="var(--color-brand-navy)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="var(--color-brand-red)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
