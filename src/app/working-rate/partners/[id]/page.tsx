'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useWorkingRates } from '@/hooks/useWorkingRates';
import { getDateRangePresets, formatCurrency, formatHours, formatRate } from '@/lib/working-rate/utils';
import { DateRangePicker } from '@/components/working-rate/DateRangePicker';
import { MetricCard } from '@/components/working-rate/MetricCard';
import { RateBadge } from '@/components/working-rate/Badge';
import { LoadingSkeleton } from '@/components/working-rate/LoadingSpinner';
import { EmptyState } from '@/components/working-rate/EmptyState';
import { TimeEntry } from '@/lib/working-rate/types';

interface GroupedEntries {
  userName: string;
  totalHours: number;
  entries: TimeEntry[];
}

export default function PartnerDetailPage() {
  const params = useParams();
  const partnerId = params.id as string;

  const presets = getDateRangePresets();
  const [from, setFrom] = useState(presets[0].from);
  const [to, setTo] = useState(presets[0].to);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const { data, loading, error } = useWorkingRates(from, to);

  const partner = data?.partners.find((p) => p.partnerId === partnerId);

  // Fetch time entries for this partner's Harvest client
  const fetchTimeEntries = useCallback(async () => {
    if (!partner) return;

    // We need to find the Harvest client_id — query our working-rates data
    // The time entries API can be used if we have a client_id
    // For now, we fetch all entries and filter client-side
    setEntriesLoading(true);
    try {
      const res = await fetch(
        `/api/harvest/time-entries?from=${from}&to=${to}`,
      );
      if (res.ok) {
        const json = await res.json();
        const entries: TimeEntry[] = json.time_entries
          .filter(
            (e: { client: { name: string } }) =>
              e.client.name.toLowerCase().includes(partner.partnerName.toLowerCase()) ||
              partner.partnerName.toLowerCase().includes(e.client.name.toLowerCase()),
          )
          .map(
            (e: {
              id: number;
              hours: number;
              spent_date: string;
              client: { id: number; name: string };
              user: { id: number; name: string };
              project: { name: string };
              task: { name: string };
            }) => ({
              id: e.id,
              hours: e.hours,
              date: e.spent_date,
              clientId: e.client.id,
              clientName: e.client.name,
              userId: e.user.id,
              userName: e.user.name,
              projectName: e.project.name,
              taskName: e.task.name,
            }),
          );
        setTimeEntries(entries);
      }
    } catch {
      // Time entries fetch failed — non-critical
    } finally {
      setEntriesLoading(false);
    }
  }, [from, to, partner]);

  useEffect(() => {
    if (partner) {
      fetchTimeEntries();
    }
  }, [partner, fetchTimeEntries]);

  // Group entries by team member
  const grouped: GroupedEntries[] = [];
  const userMap = new Map<string, TimeEntry[]>();
  for (const entry of timeEntries) {
    const existing = userMap.get(entry.userName) ?? [];
    existing.push(entry);
    userMap.set(entry.userName, existing);
  }
  for (const [userName, entries] of userMap) {
    grouped.push({
      userName,
      totalHours: entries.reduce((sum, e) => sum + e.hours, 0),
      entries: entries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    });
  }
  grouped.sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <a
              href="/working-rate/partners"
              className="text-xs font-sans text-brand-red hover:text-brand-red-hover transition-colors"
            >
              Partners
            </a>
            <span className="text-xs text-gray-300">/</span>
          </div>
          <h1 className="text-[40px] font-sans font-bold text-brand-navy leading-tight">
            {partner?.partnerName ?? 'Loading...'}
          </h1>
          {partner && (
            <p className="text-sm font-serif text-gray-500 mt-1">
              Managed by {partner.marketingDirector || 'Unassigned'}
            </p>
          )}
        </div>
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-sans font-medium text-red-800">Failed to load data</p>
          <p className="text-xs font-serif text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {!loading && !error && partner && (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Monthly Invoice"
              value={formatCurrency(partner.monthlyInvoice)}
            />
            <MetricCard
              label="Working Rate"
              value={partner.workingRate > 0 ? formatRate(partner.workingRate) : '—'}
              subtitle={partner.workingRate > 0 ? 'per hour' : 'No hours tracked'}
            />
            <MetricCard
              label="Hours Tracked"
              value={partner.totalHours > 0 ? formatHours(partner.totalHours) : '0'}
              subtitle={`${data?.period.months} month${(data?.period.months ?? 0) !== 1 ? 's' : ''}`}
            />
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center">
              <div className="text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider mb-2">
                Rate Status
              </div>
              <RateBadge rate={partner.workingRate} />
            </div>
          </div>

          {/* Time Entry Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xs font-sans font-bold text-brand-navy/50 uppercase tracking-wider">
                Time Entry Breakdown
              </h3>
              {entriesLoading && (
                <div className="w-4 h-4 border-2 border-brand-navy/20 border-t-brand-red rounded-full animate-spin" />
              )}
            </div>

            {grouped.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {grouped.map((group) => (
                  <div key={group.userName}>
                    {/* Group header */}
                    <div className="px-4 py-3 bg-gray-50/50 flex items-center justify-between">
                      <span className="text-sm font-sans font-bold text-brand-navy">
                        {group.userName}
                      </span>
                      <span className="text-xs font-sans font-medium text-brand-navy/50">
                        {formatHours(group.totalHours)} hours
                      </span>
                    </div>
                    {/* Entries */}
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="px-4 py-2 text-[10px] font-sans font-bold text-brand-navy/40 uppercase tracking-wider text-left">
                            Date
                          </th>
                          <th className="px-4 py-2 text-[10px] font-sans font-bold text-brand-navy/40 uppercase tracking-wider text-left">
                            Project
                          </th>
                          <th className="px-4 py-2 text-[10px] font-sans font-bold text-brand-navy/40 uppercase tracking-wider text-left">
                            Task
                          </th>
                          <th className="px-4 py-2 text-[10px] font-sans font-bold text-brand-navy/40 uppercase tracking-wider text-right">
                            Hours
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.entries.map((entry) => (
                          <tr key={entry.id} className="border-b border-gray-50/50 hover:bg-gray-50/30">
                            <td className="px-4 py-2 text-xs font-serif text-gray-600">
                              {new Date(entry.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-2 text-xs font-serif text-gray-600">
                              {entry.projectName}
                            </td>
                            <td className="px-4 py-2 text-xs font-serif text-gray-600">
                              {entry.taskName}
                            </td>
                            <td className="px-4 py-2 text-xs font-sans font-medium text-brand-navy text-right">
                              {entry.hours.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : !entriesLoading ? (
              <div className="py-8 text-center text-sm font-serif text-gray-400">
                No time entries found for this partner in the selected period
              </div>
            ) : null}
          </div>
        </>
      )}

      {!loading && !error && !partner && (
        <EmptyState
          title="Partner not found"
          description="This partner may not exist or may not be active in the selected period."
        />
      )}
    </div>
  );
}
