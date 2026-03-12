import {
  WorkingRateData,
  MarketingDirectorSummary,
  Partner,
  TimeEntry,
} from './types';

export function calculateWorkingRate(
  monthlyInvoice: number,
  totalHours: number,
  numberOfMonths: number = 1,
): number {
  const totalInvoiceValue = monthlyInvoice * numberOfMonths;
  if (totalHours === 0) return 0;
  return totalInvoiceValue / totalHours;
}

export function calculateMonthsBetween(from: string, to: string): number {
  const start = new Date(from);
  const end = new Date(to);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1;
  return Math.max(1, months);
}

export function buildWorkingRateData(
  partners: Partner[],
  timeEntries: TimeEntry[],
  periodStart: string,
  periodEnd: string,
  numberOfMonths: number,
): WorkingRateData[] {
  // Sum hours by client
  const hoursByClient = new Map<number, number>();
  for (const entry of timeEntries) {
    const current = hoursByClient.get(entry.clientId) ?? 0;
    hoursByClient.set(entry.clientId, current + entry.hours);
  }

  return partners
    .filter((p) => p.isActive)
    .map((partner) => {
      const totalHours = partner.harvestClientId
        ? (hoursByClient.get(partner.harvestClientId) ?? 0)
        : 0;
      const workingRate = calculateWorkingRate(
        partner.monthlyInvoice,
        totalHours,
        numberOfMonths,
      );

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        monthlyInvoice: partner.monthlyInvoice,
        totalHours,
        workingRate,
        marketingDirector: partner.marketingDirector,
        periodStart,
        periodEnd,
      };
    });
}

export function buildDirectorSummaries(
  workingRates: WorkingRateData[],
): MarketingDirectorSummary[] {
  const directorMap = new Map<string, WorkingRateData[]>();

  for (const rate of workingRates) {
    const director = rate.marketingDirector || 'Unassigned';
    const existing = directorMap.get(director) ?? [];
    existing.push(rate);
    directorMap.set(director, existing);
  }

  return Array.from(directorMap.entries()).map(([name, clients]) => {
    const totalInvoiceValue = clients.reduce(
      (sum, c) => sum + c.monthlyInvoice,
      0,
    );
    const totalHours = clients.reduce((sum, c) => sum + c.totalHours, 0);
    const averageWorkingRate =
      totalHours === 0 ? 0 : totalInvoiceValue / totalHours;

    return {
      name,
      clients,
      totalInvoiceValue,
      totalHours,
      averageWorkingRate,
      clientCount: clients.length,
    };
  });
}
