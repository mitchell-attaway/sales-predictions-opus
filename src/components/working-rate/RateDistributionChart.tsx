'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { WorkingRateData } from '@/lib/working-rate/types';

interface RateDistributionChartProps {
  data: WorkingRateData[];
  averageRate: number;
}

export function RateDistributionChart({
  data,
  averageRate,
}: RateDistributionChartProps) {
  // Build histogram buckets
  const buckets = [
    { range: '$0-25', min: 0, max: 25, count: 0 },
    { range: '$25-50', min: 25, max: 50, count: 0 },
    { range: '$50-75', min: 50, max: 75, count: 0 },
    { range: '$75-100', min: 75, max: 100, count: 0 },
    { range: '$100-125', min: 100, max: 125, count: 0 },
    { range: '$125-150', min: 125, max: 150, count: 0 },
    { range: '$150-200', min: 150, max: 200, count: 0 },
    { range: '$200+', min: 200, max: Infinity, count: 0 },
  ];

  for (const d of data) {
    if (d.workingRate === 0) continue;
    const bucket = buckets.find(
      (b) => d.workingRate >= b.min && d.workingRate < b.max,
    );
    if (bucket) bucket.count++;
  }

  // Find which bucket the average falls in for reference line
  const avgBucketIndex = buckets.findIndex(
    (b) => averageRate >= b.min && averageRate < b.max,
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-xs font-sans font-bold text-brand-navy/50 uppercase tracking-wider mb-1">
        Rate Distribution
      </h3>
      <div className="h-0.5 w-8 bg-brand-red rounded-full mb-4" />

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 11, fontFamily: 'Inter' }}
              stroke="#9ca3af"
            />
            <YAxis
              allowDecimals={false}
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
              formatter={(value) => [`${value} partners`, 'Count']}
            />
            <Bar
              dataKey="count"
              fill="#03293A"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
            {avgBucketIndex >= 0 && (
              <ReferenceLine
                x={buckets[avgBucketIndex].range}
                stroke="#FF1E00"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: `Avg: $${Math.round(averageRate)}/hr`,
                  position: 'top',
                  fill: '#FF1E00',
                  fontSize: 11,
                  fontFamily: 'Inter',
                  fontWeight: 700,
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
