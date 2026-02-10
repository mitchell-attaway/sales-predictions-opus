'use client';

import { useMemo } from 'react';
import type { Prospect } from '@/types';
import { fmtCurrency } from '@/lib/format';

interface InsightsStripProps {
  pipeline: Prospect[];
}

interface Insight {
  icon: string;
  label: string;
  value: string;
}

export function InsightsStrip({ pipeline }: InsightsStripProps) {
  const insights = useMemo<Insight[]>(() => {
    if (pipeline.length === 0) return [];

    const result: Insight[] = [];

    // Top owner by weighted pipeline
    const ownerWeighted = new Map<string, number>();
    for (const p of pipeline) {
      const key = p.owner || 'Unknown';
      ownerWeighted.set(key, (ownerWeighted.get(key) ?? 0) + p.dealValue * p.chanceOfClose);
    }
    const topOwner = [...ownerWeighted.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topOwner) {
      result.push({
        icon: '\uD83C\uDFC6',
        label: 'Top owner by weighted pipeline',
        value: `${topOwner[0]} (${fmtCurrency(topOwner[1])})`,
      });
    }

    // Stage with most dollars
    const stageTotals = new Map<string, number>();
    for (const p of pipeline) {
      const key = p.stage || 'Unknown';
      stageTotals.set(key, (stageTotals.get(key) ?? 0) + p.dealValue);
    }
    const topStage = [...stageTotals.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topStage) {
      result.push({
        icon: '\uD83D\uDCCA',
        label: 'Stage with most dollars',
        value: `${topStage[0]} (${fmtCurrency(topStage[1])})`,
      });
    }

    // Largest deal
    const largest = [...pipeline].sort((a, b) => b.dealValue - a.dealValue)[0];
    if (largest) {
      result.push({
        icon: '\uD83D\uDCB0',
        label: 'Largest deal in pipeline',
        value: `${largest.prospectName} (${fmtCurrency(largest.dealValue)})`,
      });
    }

    // States with highest pipeline concentration
    const stateTotals = new Map<string, number>();
    for (const p of pipeline) {
      const key = p.state || 'Unknown';
      stateTotals.set(key, (stateTotals.get(key) ?? 0) + p.dealValue);
    }
    const topStates = [...stateTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topStates.length > 0) {
      result.push({
        icon: '\uD83D\uDDFA\uFE0F',
        label: 'Top states by pipeline',
        value: topStates.map((s) => s[0]).join(', '),
      });
    }

    return result;
  }, [pipeline]);

  if (insights.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Quick Insights
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="rounded-xl border p-4 animate-slide-up"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              animationDelay: `${i * 0.05}s`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0" role="img">{insight.icon}</span>
              <div className="min-w-0">
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{insight.label}</p>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{insight.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
