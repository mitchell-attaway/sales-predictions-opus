import { NextResponse } from 'next/server';
import { getPartners } from '@/lib/working-rate/airtable';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const partners = await getPartners();
    return NextResponse.json({ partners });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch partners';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
