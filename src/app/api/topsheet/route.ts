import { NextResponse } from 'next/server';
import { getYearlyTabUrl } from '@/config/sheet';
import { fetchCsv } from '@/lib/fetcher';
import { parseTopSheetCsv } from '@/lib/parsers/topsheet';
import type { TopSheetApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = getYearlyTabUrl();
    const csvText = await fetchCsv(url, 'topsheet-sample.csv');
    const data = parseTopSheetCsv(csvText);

    return NextResponse.json<TopSheetApiResponse>({
      data,
      error: null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching top sheet data';
    return NextResponse.json<TopSheetApiResponse>(
      { data: null, error: message, fetchedAt: new Date().toISOString() },
      { status: 502 }
    );
  }
}
