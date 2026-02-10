'use client';

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  accent?: boolean;
}

export function KpiCard({ label, value, subtitle, trend, accent }: KpiCardProps) {
  return (
    <div
      className="rounded-xl border p-4 sm:p-5 transition-shadow hover:shadow-md animate-slide-up"
      style={{
        backgroundColor: accent ? 'var(--color-brand-red)' : 'var(--bg-card)',
        borderColor: accent ? 'transparent' : 'var(--border-color)',
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: accent ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}
      >
        {label}
      </p>
      <p
        className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none"
        style={{ color: accent ? '#ffffff' : 'var(--text-primary)' }}
      >
        {value}
      </p>
      {subtitle && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend && trend !== 'neutral' && (
            <span style={{ color: accent ? 'rgba(255,255,255,0.9)' : trend === 'up' ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {trend === 'up' ? '\u25B2' : '\u25BC'}
            </span>
          )}
          <p
            className="text-xs font-medium"
            style={{ color: accent ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)' }}
          >
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
}
