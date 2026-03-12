export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyDetailed(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatHours(hours: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(hours);
}

export function formatRate(rate: number): string {
  if (rate === 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rate);
}

export function getRateStatus(
  rate: number,
): 'high' | 'medium' | 'low' | 'none' {
  if (rate === 0) return 'none';
  if (rate >= 100) return 'high';
  if (rate >= 75) return 'medium';
  return 'low';
}

export function getRateBadgeClasses(status: 'high' | 'medium' | 'low' | 'none'): string {
  switch (status) {
    case 'high':
      return 'bg-brand-navy text-white';
    case 'medium':
      return 'bg-amber-500 text-white';
    case 'low':
      return 'bg-brand-red text-white';
    case 'none':
      return 'bg-gray-300 text-gray-600';
  }
}

export function getDateRangePresets(): {
  label: string;
  from: string;
  to: string;
}[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const firstOfMonth = new Date(year, month, 1);
  const today = now;

  const lastMonthStart = new Date(year, month - 1, 1);
  const lastMonthEnd = new Date(year, month, 0);

  const threeMonthsStart = new Date(year, month - 2, 1);
  const sixMonthsStart = new Date(year, month - 5, 1);
  const ytdStart = new Date(year, 0, 1);

  return [
    { label: 'This Month', from: fmt(firstOfMonth), to: fmt(today) },
    {
      label: 'Last Month',
      from: fmt(lastMonthStart),
      to: fmt(lastMonthEnd),
    },
    {
      label: 'Last 3 Months',
      from: fmt(threeMonthsStart),
      to: fmt(today),
    },
    {
      label: 'Last 6 Months',
      from: fmt(sixMonthsStart),
      to: fmt(today),
    },
    { label: 'Year to Date', from: fmt(ytdStart), to: fmt(today) },
  ];
}
