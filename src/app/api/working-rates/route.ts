import { NextRequest, NextResponse } from 'next/server';
import { getClients, getTimeEntries } from '@/lib/working-rate/harvest';
import { getPartners } from '@/lib/working-rate/airtable';
import { matchPartners } from '@/lib/working-rate/matching';
import {
  buildWorkingRateData,
  buildDirectorSummaries,
  calculateMonthsBetween,
} from '@/lib/working-rate/calculations';
import { TimeEntry, WorkingRatesResponse } from '@/lib/working-rate/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const directorName = searchParams.get('directorName');

  if (!from || !to) {
    return NextResponse.json(
      { error: 'Missing required parameters: from, to' },
      { status: 400 },
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from) || !dateRegex.test(to)) {
    return NextResponse.json(
      { error: 'Invalid date format. Use YYYY-MM-DD.' },
      { status: 400 },
    );
  }

  try {
    // Fetch data from both APIs in parallel
    const [partners, harvestClients, harvestEntries] = await Promise.all([
      getPartners(),
      getClients(),
      getTimeEntries(from, to),
    ]);

    // Match partners between Airtable and Harvest
    const { matched, unmatched } = matchPartners(partners, harvestClients);

    // Transform Harvest time entries to our TimeEntry format
    const timeEntries: TimeEntry[] = harvestEntries.map((e) => ({
      id: e.id,
      hours: e.hours,
      date: e.spent_date,
      clientId: e.client.id,
      clientName: e.client.name,
      userId: e.user.id,
      userName: e.user.name,
      projectName: e.project.name,
      taskName: e.task.name,
    }));

    const numberOfMonths = calculateMonthsBetween(from, to);

    // Filter by director if specified
    let activePartners = matched.filter((p) => p.isActive);
    if (directorName) {
      activePartners = activePartners.filter(
        (p) =>
          p.marketingDirector.toLowerCase() === directorName.toLowerCase(),
      );
    }

    // Build working rate data
    const workingRates = buildWorkingRateData(
      activePartners,
      timeEntries,
      from,
      to,
      numberOfMonths,
    );

    // Build director summaries
    const directors = buildDirectorSummaries(workingRates);

    // Calculate totals
    const totalInvoiceValue = workingRates.reduce(
      (sum, r) => sum + r.monthlyInvoice * numberOfMonths,
      0,
    );
    const totalHours = workingRates.reduce(
      (sum, r) => sum + r.totalHours,
      0,
    );

    const response: WorkingRatesResponse = {
      period: { from, to, months: numberOfMonths },
      partners: workingRates,
      directors,
      totals: {
        totalPartners: workingRates.length,
        totalInvoiceValue,
        totalHours,
        overallWorkingRate: totalHours === 0 ? 0 : totalInvoiceValue / totalHours,
      },
    };

    if (unmatched.length > 0) {
      return NextResponse.json({ ...response, unmatchedPartners: unmatched });
    }

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to compute working rates';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
