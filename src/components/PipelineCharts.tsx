'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import type { Prospect } from '@/types';
import { fmtCompact, fmtCurrency, fmtPercent } from '@/lib/format';
import { PipelineMap } from './PipelineMap';

interface PipelineChartsProps {
  pipeline: Prospect[];
}

const CHART_COLORS = [
  '#ff1e00', '#03293a', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border p-3 text-xs shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: 'var(--text-secondary)' }}>
          {fmtCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; dealValue: number; chanceOfClose: number } }> }) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border p-3 text-xs shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
      <p style={{ color: 'var(--text-secondary)' }}>Value: {fmtCurrency(d.dealValue)}</p>
      <p style={{ color: 'var(--text-secondary)' }}>Close %: {fmtPercent(d.chanceOfClose)}</p>
    </div>
  );
}

export function PipelineCharts({ pipeline }: PipelineChartsProps) {
  const byStage = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pipeline) {
      const stage = p.stage || 'Unknown';
      map.set(stage, (map.get(stage) ?? 0) + p.dealValue);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [pipeline]);

  const byOwner = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pipeline) {
      const owner = p.owner || 'Unknown';
      map.set(owner, (map.get(owner) ?? 0) + p.dealValue);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [pipeline]);

  const scatterData = useMemo(() => {
    return pipeline
      .filter((p) => p.dealValue > 0 && p.chanceOfClose > 0)
      .map((p) => ({
        name: p.prospectName,
        dealValue: p.dealValue,
        chanceOfClose: p.chanceOfClose,
        z: p.dealValue,
      }));
  }, [pipeline]);

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Pipeline Breakdown
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Stage */}
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Pipeline by Stage
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byStage} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" tickFormatter={(v: number) => fmtCompact(v)} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {byStage.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Owner */}
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Pipeline by Owner
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byOwner}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => fmtCompact(v)} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {byOwner.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Scatter: Deal Value vs Close % */}
        {scatterData.length > 0 && (
          <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Deal Value vs Close Probability
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="chanceOfClose"
                  name="Close %"
                  type="number"
                  domain={[0, 1]}
                  tickFormatter={(v: number) => fmtPercent(v)}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                />
                <YAxis
                  dataKey="dealValue"
                  name="Deal Value"
                  tickFormatter={(v: number) => fmtCompact(v)}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                />
                <ZAxis dataKey="z" range={[40, 400]} />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter data={scatterData} fill="var(--color-brand-red)" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* US Map: Pipeline by State */}
      <div className="mt-4">
        <PipelineMap pipeline={pipeline} />
      </div>
    </section>
  );
}
