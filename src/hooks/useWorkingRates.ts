'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkingRatesResponse } from '@/lib/working-rate/types';

export function useWorkingRates(from: string, to: string, directorName?: string) {
  const [data, setData] = useState<WorkingRatesResponse | null>(null);
  const [unmatchedPartners, setUnmatchedPartners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ from, to });
      if (directorName) params.set('directorName', directorName);

      const res = await fetch(`/api/working-rates?${params}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      setUnmatchedPartners(json.unmatchedPartners ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [from, to, directorName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, unmatchedPartners, loading, error, refetch: fetchData };
}
