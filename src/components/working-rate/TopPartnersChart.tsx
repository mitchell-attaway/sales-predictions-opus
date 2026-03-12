'use client';

import { WorkingRateData } from '@/lib/working-rate/types';
import { formatRate } from '@/lib/working-rate/utils';

interface TopPartnersChartProps {
  data: WorkingRateData[];
}

export function TopPartnersChart({ data }: TopPartnersChartProps) {
  const withRates = data.filter((d) => d.workingRate > 0);
  const sorted = [...withRates].sort((a, b) => b.workingRate - a.workingRate);
  const highest = sorted.slice(0, 10);
  const lowest = [...sorted].reverse().slice(0, 10);

  const maxRate = highest.length > 0 ? highest[0].workingRate : 100;

  function RateBar({ items, label }: { items: WorkingRateData[]; label: string }) {
    return (
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-sans font-bold text-brand-navy/50 uppercase tracking-wider mb-3">
          {label}
        </h4>
        <div className="space-y-2">
          {items.map((d, i) => {
            const width = Math.max((d.workingRate / maxRate) * 100, 8);
            return (
              <div key={d.partnerId} className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold text-brand-navy/40 w-4 text-right">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-sans text-brand-navy truncate">
                      {d.partnerName}
                    </span>
                    <span className="text-xs font-sans font-bold text-brand-navy ml-2 shrink-0">
                      {formatRate(d.workingRate)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        label.includes('Highest')
                          ? 'bg-brand-navy'
                          : 'bg-brand-red'
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-xs font-sans font-bold text-brand-navy/50 uppercase tracking-wider mb-1">
        Top & Bottom Partners
      </h3>
      <div className="h-0.5 w-8 bg-brand-red rounded-full mb-4" />

      <div className="flex flex-col lg:flex-row gap-8">
        <RateBar items={highest} label="Highest Working Rates" />
        <div className="hidden lg:block w-px bg-gray-100" />
        <RateBar items={lowest} label="Lowest Working Rates" />
      </div>
    </div>
  );
}
