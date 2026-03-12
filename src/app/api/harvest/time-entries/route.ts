import { NextRequest, NextResponse } from 'next/server';
import { getTimeEntries } from '@/lib/working-rate/harvest';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const clientId = searchParams.get('client_id');
  const userId = searchParams.get('user_id');

  if (!from || !to) {
    return NextResponse.json(
      { error: 'Missing required parameters: from, to' },
      { status: 400 },
    );
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from) || !dateRegex.test(to)) {
    return NextResponse.json(
      { error: 'Invalid date format. Use YYYY-MM-DD.' },
      { status: 400 },
    );
  }

  try {
    const entries = await getTimeEntries(
      from,
      to,
      clientId ? Number(clientId) : undefined,
      userId ? Number(userId) : undefined,
    );
    return NextResponse.json({
      time_entries: entries,
      total: entries.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch time entries';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
