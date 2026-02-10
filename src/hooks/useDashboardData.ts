'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MonthlyData, TopSheetData, MonthlyApiResponse, TopSheetApiResponse } from '@/types';

interface DashboardState {
  monthly: MonthlyData | null;
  topSheet: TopSheetData | null;
  loading: boolean;
  error: string | null;
  fetchedAt: string | null;
}

export function useDashboardData(month: string) {
  const [state, setState] = useState<DashboardState>({
    monthly: null,
    topSheet: null,
    loading: true,
    error: null,
    fetchedAt: null,
  });

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const [monthlyRes, topSheetRes] = await Promise.all([
        fetch(`/api/monthly?month=${month}`),
        fetch('/api/topsheet'),
      ]);

      const monthlyJson: MonthlyApiResponse = await monthlyRes.json();
      const topSheetJson: TopSheetApiResponse = await topSheetRes.json();

      const errors: string[] = [];
      if (monthlyJson.error) errors.push(`Pipeline: ${monthlyJson.error}`);
      if (topSheetJson.error) errors.push(`Top Sheet: ${topSheetJson.error}`);

      setState({
        monthly: monthlyJson.data,
        topSheet: topSheetJson.data,
        loading: false,
        error: errors.length > 0 ? errors.join('; ') : null,
        fetchedAt: monthlyJson.fetchedAt ?? topSheetJson.fetchedAt ?? new Date().toISOString(),
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch data',
      }));
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
