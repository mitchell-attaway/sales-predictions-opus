'use client';

import { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import type { Prospect } from '@/types';
import { fmtCurrency, fmtCompact } from '@/lib/format';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

/** Map full state names to two-letter abbreviations and vice versa */
const STATE_NAME_MAP: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO',
  Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY', 'District of Columbia': 'DC',
};

/** Reverse map: abbreviation → full name */
const ABBREV_TO_NAME: Record<string, string> = {};
for (const [name, abbrev] of Object.entries(STATE_NAME_MAP)) {
  ABBREV_TO_NAME[abbrev] = name;
}

/** Normalise a state string to a canonical full name for matching */
function normalizeStateName(input: string): string {
  const trimmed = input.trim();
  // If it's a 2-letter abbreviation, convert to full name
  if (trimmed.length === 2 && ABBREV_TO_NAME[trimmed.toUpperCase()]) {
    return ABBREV_TO_NAME[trimmed.toUpperCase()];
  }
  // Title-case match
  const titleCase = trimmed
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  if (STATE_NAME_MAP[titleCase]) {
    return titleCase;
  }
  // Case-insensitive lookup
  for (const name of Object.keys(STATE_NAME_MAP)) {
    if (name.toLowerCase() === trimmed.toLowerCase()) return name;
  }
  return trimmed;
}

/** Color scale from light to brand-red based on value intensity */
function getStateColor(value: number, maxValue: number, isDark: boolean): string {
  if (value === 0) return isDark ? '#0f3a4f' : '#f3f4f6';
  const intensity = Math.min(value / maxValue, 1);
  // Interpolate from light tint to full brand-red
  if (isDark) {
    // Dark mode: from navy-lighter to brand-red
    const r = Math.round(15 + (255 - 15) * intensity);
    const g = Math.round(58 + (30 - 58) * intensity);
    const b = Math.round(79 + (0 - 79) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Light mode: from light gray to brand-red
    const r = Math.round(243 + (255 - 243) * intensity);
    const g = Math.round(244 - 244 * intensity * 0.87);
    const b = Math.round(246 - 246 * intensity * 1.0);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

interface PipelineMapProps {
  pipeline: Prospect[];
}

export function PipelineMap({ pipeline }: PipelineMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Detect dark mode via CSS custom property
  const isDark = typeof window !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : false;

  const stateData = useMemo(() => {
    const map = new Map<string, { value: number; deals: number }>();
    for (const p of pipeline) {
      if (!p.state) continue;
      const name = normalizeStateName(p.state);
      const existing = map.get(name) ?? { value: 0, deals: 0 };
      existing.value += p.dealValue;
      existing.deals += 1;
      map.set(name, existing);
    }
    return map;
  }, [pipeline]);

  const maxValue = useMemo(() => {
    let max = 0;
    for (const { value } of stateData.values()) {
      if (value > max) max = value;
    }
    return max;
  }, [stateData]);

  const activeStatesCount = stateData.size;
  const totalStatesValue = useMemo(() => {
    let total = 0;
    for (const { value } of stateData.values()) total += value;
    return total;
  }, [stateData]);

  const hoveredData = hoveredState ? stateData.get(hoveredState) : null;

  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Pipeline by State
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {activeStatesCount} state{activeStatesCount !== 1 ? 's' : ''} &middot; {fmtCompact(totalStatesValue)}
        </span>
      </div>

      <div
        className="relative"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 900 }}
          width={780}
          height={500}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateName = geo.properties.name as string;
                const data = stateData.get(stateName);
                const value = data?.value ?? 0;
                const fillColor = getStateColor(value, maxValue, isDark);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHoveredState(stateName)}
                    onMouseLeave={() => setHoveredState(null)}
                    style={{
                      default: {
                        fill: fillColor,
                        stroke: isDark ? '#03293a' : '#ffffff',
                        strokeWidth: 0.75,
                        outline: 'none',
                        transition: 'fill 0.2s ease',
                      },
                      hover: {
                        fill: value > 0
                          ? '#ff1e00'
                          : isDark ? '#1a4a5e' : '#e5e7eb',
                        stroke: isDark ? '#03293a' : '#ffffff',
                        strokeWidth: 1.2,
                        outline: 'none',
                        cursor: value > 0 ? 'pointer' : 'default',
                      },
                      pressed: {
                        fill: '#ac1500',
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Tooltip */}
        {hoveredState && (
          <div
            className="absolute z-10 pointer-events-none rounded-lg border px-3 py-2 shadow-lg text-xs"
            style={{
              left: Math.min(tooltipPos.x + 12, 280),
              top: tooltipPos.y - 50,
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            <p className="font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
              {hoveredState}
              {STATE_NAME_MAP[hoveredState] && (
                <span style={{ color: 'var(--text-muted)' }}> ({STATE_NAME_MAP[hoveredState]})</span>
              )}
            </p>
            {hoveredData ? (
              <>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Pipeline: <span className="font-semibold text-brand-red">{fmtCurrency(hoveredData.value)}</span>
                </p>
                <p style={{ color: 'var(--text-muted)' }}>
                  {hoveredData.deals} deal{hoveredData.deals !== 1 ? 's' : ''}
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No active prospects</p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>$0</span>
        <div
          className="h-2 w-32 rounded-full"
          style={{
            background: isDark
              ? 'linear-gradient(to right, #0f3a4f, #ff1e00)'
              : 'linear-gradient(to right, #f3f4f6, #ff1e00)',
          }}
        />
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{fmtCompact(maxValue)}</span>
      </div>
    </div>
  );
}
