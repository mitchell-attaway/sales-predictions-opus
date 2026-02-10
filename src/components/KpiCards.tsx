'use client';

import { KpiCard } from './KpiCard';
import type { MonthlyData } from '@/types';
import { fmtCompact } from '@/lib/format';

interface KpiCardsProps {
  data: MonthlyData;
}

export function KpiCards({ data }: KpiCardsProps) {
  const { pipeline, actuals } = data;

  const totalPipeline = pipeline.reduce((s, p) => s + p.dealValue, 0);
  const weightedPipeline = pipeline.reduce((s, p) => s + p.dealValue * p.chanceOfClose, 0);
  const weighted30 = pipeline.reduce((s, p) => s + p.dealValue * p.chanceNext30, 0);
  const weighted60 = pipeline.reduce((s, p) => s + p.dealValue * p.chanceNext60, 0);
  const closedTotal = actuals.reduce((s, a) => s + a.dealValue, 0);
  const closedCount = actuals.length;

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Current Month Pipeline
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Pipeline" value={fmtCompact(totalPipeline)} subtitle={`${pipeline.length} deals`} />
        <KpiCard label="Weighted Pipeline" value={fmtCompact(weightedPipeline)} subtitle="by close probability" />
        <KpiCard label="Next 30 Days" value={fmtCompact(weighted30)} subtitle="weighted forecast" />
        <KpiCard label="Next 60 Days" value={fmtCompact(weighted60)} subtitle="weighted forecast" />
        <KpiCard label="Closed This Month" value={fmtCompact(closedTotal)} subtitle={`${closedCount} deal${closedCount !== 1 ? 's' : ''}`} accent />
        <KpiCard label="Closed Deals" value={String(closedCount)} subtitle="this month" accent />
      </div>
    </section>
  );
}
