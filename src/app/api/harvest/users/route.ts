import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/working-rate/harvest';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch users';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
