import { NextResponse } from 'next/server';
import { getClients } from '@/lib/working-rate/harvest';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json({ clients });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch clients';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
