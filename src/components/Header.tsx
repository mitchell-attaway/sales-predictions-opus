'use client';

import { useTheme } from './ThemeProvider';
import { AVAILABLE_MONTHS, MONTH_LABELS } from '@/config/monthTabs';

interface HeaderProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  fetchedAt: string | null;
  onRefresh: () => void;
  loading: boolean;
}

export function Header({ selectedMonth, onMonthChange, fetchedAt, onRefresh, loading }: HeaderProps) {
  const { theme, toggle } = useTheme();

  const formattedTime = fetchedAt
    ? new Date(fetchedAt).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-sm" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border-color)' }}>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-brand-red flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m7 16 4-8 4 4 4-8" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
              <span className="hidden sm:inline">Harbinger </span>Sales Pipeline
            </h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Month selector */}
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="rounded-lg border px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-red/30"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              {AVAILABLE_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {MONTH_LABELS[m] ?? m}
                </option>
              ))}
            </select>

            {/* Last updated */}
            {formattedTime && (
              <span className="hidden md:block text-xs" style={{ color: 'var(--text-muted)' }}>
                Updated {formattedTime}
              </span>
            )}

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="rounded-lg border p-2 transition-colors hover:bg-brand-red/10 focus:outline-none focus:ring-2 focus:ring-brand-red/30 disabled:opacity-50"
              style={{ borderColor: 'var(--border-color)' }}
              title="Refresh data"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={loading ? 'animate-spin' : ''}
                style={{ color: 'var(--text-secondary)' }}
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="rounded-lg border p-2 transition-colors hover:bg-brand-red/10 focus:outline-none focus:ring-2 focus:ring-brand-red/30"
              style={{ borderColor: 'var(--border-color)' }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
