import Link from 'next/link';
import { MarketingDirectorSummary } from '@/lib/working-rate/types';
import { formatCurrency, formatHours, formatRate } from '@/lib/working-rate/utils';
import { RateBadge } from './Badge';

interface MDSummaryCardProps {
  director: MarketingDirectorSummary;
}

export function MDSummaryCard({ director }: MDSummaryCardProps) {
  const maxRate = Math.max(...director.clients.map((c) => c.workingRate), 1);

  return (
    <Link
      href={`/working-rate/directors/${encodeURIComponent(director.name)}`}
      className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-red/20 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-sans font-bold text-brand-navy">
            {director.name}
          </h3>
          <p className="text-xs font-serif text-gray-500">
            {director.clientCount} active client{director.clientCount !== 1 ? 's' : ''}
          </p>
        </div>
        <RateBadge rate={director.averageWorkingRate} />
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="text-[10px] font-sans font-bold text-brand-navy/40 uppercase tracking-wider">
            Invoice
          </div>
          <div className="text-sm font-sans font-bold text-brand-navy">
            {formatCurrency(director.totalInvoiceValue)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-sans font-bold text-brand-navy/40 uppercase tracking-wider">
            Hours
          </div>
          <div className="text-sm font-sans font-bold text-brand-navy">
            {formatHours(director.totalHours)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-sans font-bold text-brand-navy/40 uppercase tracking-wider">
            Avg Rate
          </div>
          <div className="text-sm font-sans font-bold text-brand-navy">
            {formatRate(director.averageWorkingRate)}
          </div>
        </div>
      </div>

      {/* Mini bar chart of client rates */}
      <div className="space-y-1.5">
        {director.clients
          .sort((a, b) => b.workingRate - a.workingRate)
          .slice(0, 5)
          .map((client) => (
            <div key={client.partnerId} className="flex items-center gap-2">
              <span className="text-[10px] font-sans text-gray-500 w-20 truncate">
                {client.partnerName}
              </span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-navy rounded-full"
                  style={{
                    width: `${Math.max((client.workingRate / maxRate) * 100, 4)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-sans font-bold text-brand-navy w-12 text-right">
                {formatRate(client.workingRate)}
              </span>
            </div>
          ))}
        {director.clients.length > 5 && (
          <div className="text-[10px] font-sans text-gray-400 text-center">
            +{director.clients.length - 5} more
          </div>
        )}
      </div>
    </Link>
  );
}
