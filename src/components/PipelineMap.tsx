'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import type { Prospect } from '@/types';
import { fmtCurrency, fmtCompact } from '@/lib/format';

/**
 * Pre-projected Albers USA TopoJSON from us-atlas.
 * Coordinates are already in screen space (~960x600), so no d3-geo needed.
 */
const TOPO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json';

/** FIPS code → state name mapping (US Census standard) */
const FIPS_TO_NAME: Record<string, string> = {
  '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas',
  '06': 'California', '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware',
  '11': 'District of Columbia', '12': 'Florida', '13': 'Georgia', '15': 'Hawaii',
  '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa',
  '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine',
  '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
  '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska',
  '32': 'Nevada', '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico',
  '36': 'New York', '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio',
  '40': 'Oklahoma', '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island',
  '45': 'South Carolina', '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas',
  '49': 'Utah', '50': 'Vermont', '51': 'Virginia', '53': 'Washington',
  '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming',
};

/** Full state name → two-letter abbreviation */
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

/** Normalise a state string from CSV data to a canonical full name. */
function normalizeStateName(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 2 && ABBREV_TO_NAME[trimmed.toUpperCase()]) {
    return ABBREV_TO_NAME[trimmed.toUpperCase()];
  }
  const titleCase = trimmed
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  if (STATE_NAME_MAP[titleCase]) return titleCase;
  for (const name of Object.keys(STATE_NAME_MAP)) {
    if (name.toLowerCase() === trimmed.toLowerCase()) return name;
  }
  return trimmed;
}

/** Color scale from neutral to brand-red based on value intensity. */
function getStateColor(value: number, maxValue: number, isDark: boolean): string {
  if (value === 0) return isDark ? '#0f3a4f' : '#f3f4f6';
  const intensity = Math.min(value / maxValue, 1);
  if (isDark) {
    const r = Math.round(15 + (255 - 15) * intensity);
    const g = Math.round(58 + (30 - 58) * intensity);
    const b = Math.round(79 + (0 - 79) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const r = Math.round(243 + (255 - 243) * intensity);
    const g = Math.round(244 - 244 * intensity * 0.87);
    const b = Math.round(246 - 246 * intensity * 1.0);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// ---------------------------------------------------------------------------
// SVG path rendering from pre-projected GeoJSON coordinates
// ---------------------------------------------------------------------------

type Coords = number[];
type Ring = Coords[];
type PolygonCoords = Ring[];
type MultiPolygonCoords = PolygonCoords[];

function ringToPath(ring: Ring): string {
  return ring.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0]},${pt[1]}`).join('') + 'Z';
}

function geometryToPath(geometry: Geometry): string {
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates as PolygonCoords).map(ringToPath).join('');
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates as MultiPolygonCoords)
      .flatMap((polygon) => polygon.map(ringToPath))
      .join('');
  }
  return '';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StateFeature {
  id: string;
  name: string;
  path: string;
}

interface PipelineMapProps {
  pipeline: Prospect[];
}

export function PipelineMap({ pipeline }: PipelineMapProps) {
  const [features, setFeatures] = useState<StateFeature[]>([]);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [loadError, setLoadError] = useState(false);

  const isDark =
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false;

  // Fetch and parse TopoJSON once
  useEffect(() => {
    let cancelled = false;
    fetch(TOPO_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((topology: Topology) => {
        if (cancelled) return;
        const geom = topology.objects.states as GeometryCollection;
        const fc = feature(topology, geom) as FeatureCollection;
        const parsed: StateFeature[] = fc.features
          .map((f: Feature) => {
            const id = String(f.id ?? '').padStart(2, '0');
            const name = FIPS_TO_NAME[id] ?? `State ${id}`;
            const path = geometryToPath(f.geometry);
            return { id, name, path };
          })
          .filter((s) => s.path.length > 0);
        setFeatures(parsed);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => { cancelled = true; };
  }, []);

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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  if (loadError) {
    return (
      <div className="rounded-xl border p-6 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Unable to load map data. Check your network connection.
        </p>
      </div>
    );
  }

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

      <div className="relative" onMouseMove={handleMouseMove}>
        {features.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
          </div>
        ) : (
          <svg
            viewBox="0 0 960 600"
            className="w-full h-auto"
            role="img"
            aria-label="Pipeline by state map"
          >
            {features.map((sf) => {
              const data = stateData.get(sf.name);
              const value = data?.value ?? 0;
              const fillColor =
                hoveredState === sf.name
                  ? value > 0
                    ? '#ff1e00'
                    : isDark
                      ? '#1a4a5e'
                      : '#e5e7eb'
                  : getStateColor(value, maxValue, isDark);

              return (
                <path
                  key={sf.id}
                  d={sf.path}
                  fill={fillColor}
                  stroke={isDark ? '#03293a' : '#ffffff'}
                  strokeWidth={hoveredState === sf.name ? 1.5 : 0.75}
                  style={{ transition: 'fill 0.15s ease, stroke-width 0.15s ease' }}
                  onMouseEnter={() => setHoveredState(sf.name)}
                  onMouseLeave={() => setHoveredState(null)}
                  cursor={value > 0 ? 'pointer' : 'default'}
                />
              );
            })}
          </svg>
        )}

        {/* Tooltip */}
        {hoveredState && (
          <div
            className="absolute z-10 pointer-events-none rounded-lg border px-3 py-2 shadow-lg text-xs whitespace-nowrap"
            style={{
              left: Math.min(tooltipPos.x + 14, (typeof window !== 'undefined' ? window.innerWidth * 0.6 : 400)),
              top: Math.max(tooltipPos.y - 56, 0),
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
