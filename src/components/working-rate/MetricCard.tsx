interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

export function MetricCard({ label, value, subtitle }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="text-[11px] font-sans font-bold text-brand-navy/50 uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-1 h-0.5 w-8 bg-brand-red rounded-full" />
      <div className="mt-3 text-[40px] font-sans font-bold text-brand-navy leading-tight">
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs font-serif text-gray-400">{subtitle}</div>
      )}
    </div>
  );
}
