import { getRateStatus, getRateBadgeClasses, formatRate } from '@/lib/working-rate/utils';

interface RateBadgeProps {
  rate: number;
}

export function RateBadge({ rate }: RateBadgeProps) {
  const status = getRateStatus(rate);
  const classes = getRateBadgeClasses(status);

  if (status === 'none') {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-sans font-medium ${classes}`}>
        No hours
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-sans font-medium ${classes}`}>
      {formatRate(rate)}/hr
    </span>
  );
}

interface StatusBadgeProps {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  const variantClasses: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    neutral: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-sans font-medium ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}
