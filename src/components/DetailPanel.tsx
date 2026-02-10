'use client';

import { useEffect } from 'react';
import type { Prospect } from '@/types';
import { fmtCurrency, fmtPercent } from '@/lib/format';

interface DetailPanelProps {
  prospect: Prospect;
  onClose: () => void;
}

export function DetailPanel({ prospect, onClose }: DetailPanelProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const weighted = prospect.dealValue * prospect.chanceOfClose;
  const weighted30 = prospect.dealValue * prospect.chanceNext30;
  const weighted60 = prospect.dealValue * prospect.chanceNext60;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-50 animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-50 border-l overflow-y-auto animate-slide-right shadow-2xl"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {prospect.prospectName}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {prospect.stage} &middot; {prospect.state}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-brand-red/10 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            <DetailSection title="Deal Overview">
              <DetailRow label="Deal Value" value={fmtCurrency(prospect.dealValue)} />
              <DetailRow label="One-Time" value={fmtCurrency(prospect.oneTime)} />
              <DetailRow label="Onboarding" value={fmtCurrency(prospect.onboarding)} />
              <DetailRow label="Ongoing" value={fmtCurrency(prospect.ongoing)} />
            </DetailSection>

            <DetailSection title="Ownership">
              <DetailRow label="Owner" value={prospect.owner} />
              <DetailRow label="Marketing Director" value={prospect.marketingDirector} />
            </DetailSection>

            <DetailSection title="Pipeline Status">
              <DetailRow label="Pipeline Temperature" value={prospect.pipeline} />
              <DetailRow label="Stage" value={prospect.stage} />
              <DetailRow label="Status" value={prospect.closeStatus || 'Open'} />
              <DetailRow label="Expected Close" value={prospect.expectedCloseMonth || 'N/A'} />
              <DetailRow label="Expected Start" value={prospect.expectedStartDate || 'N/A'} />
            </DetailSection>

            <DetailSection title="Probabilities">
              <DetailRow label="Chance of Close" value={fmtPercent(prospect.chanceOfClose)} />
              <DetailRow label="30-Day Close %" value={fmtPercent(prospect.chanceNext30)} />
              <DetailRow label="60-Day Close %" value={fmtPercent(prospect.chanceNext60)} />
            </DetailSection>

            <DetailSection title="Weighted Values">
              <DetailRow label="Weighted (overall)" value={fmtCurrency(weighted)} highlight />
              <DetailRow label="Weighted (30-day)" value={fmtCurrency(weighted30)} />
              <DetailRow label="Weighted (60-day)" value={fmtCurrency(weighted60)} />
            </DetailSection>
          </div>
        </div>
      </div>
    </>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
        {title}
      </h3>
      <div className="rounded-lg border divide-y" style={{ borderColor: 'var(--border-color)' }}>
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between px-3 py-2" style={{ borderColor: 'var(--border-color)' }}>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-brand-red' : ''}`} style={highlight ? {} : { color: 'var(--text-primary)' }}>
        {value || '\u2014'}
      </span>
    </div>
  );
}
