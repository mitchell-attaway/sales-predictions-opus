import { NextRequest, NextResponse } from 'next/server';
import { getMonthCsvUrl } from '@/config/monthTabs';
import { fetchCsv } from '@/lib/fetcher';
import { parseMonthlyCsv } from '@/lib/parsers/monthly';
import type { MonthlyApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const month = searchParams.get('month');

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json<MonthlyApiResponse>(
      { data: null, error: 'Invalid month format. Use YYYY-MM.', fetchedAt: new Date().toISOString() },
      { status: 400 }
    );
  }

  const url = getMonthCsvUrl(month);
  if (!url) {
    return NextResponse.json<MonthlyApiResponse>(
      { data: null, error: `No tab configured for month ${month}`, fetchedAt: new Date().toISOString() },
      { status: 404 }
    );
  }

  try {
    const csvText = await fetchCsv(url, `monthly-${month}.csv`);
    const data = parseMonthlyCsv(csvText);

    return NextResponse.json<MonthlyApiResponse>({
      data,
      error: null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching monthly data';
    return NextResponse.json<MonthlyApiResponse>(
      { data: null, error: message, fetchedAt: new Date().toISOString() },
      { status: 502 }
    );
  }
}
