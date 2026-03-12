'use client';

import { useState, useRef, useEffect } from 'react';
import { getDateRangePresets } from '@/lib/working-rate/utils';

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const presets = getDateRangePresets();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePreset = presets.find((p) => p.from === from && p.to === to);
  const label = activePreset
    ? activePreset.label
    : `${from} — ${to}`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-sans font-medium text-brand-navy hover:border-brand-red/30 transition-colors"
      >
        <svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {label}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-4">
          {/* Presets */}
          <div className="mb-4">
            <div className="text-xs font-sans font-bold text-brand-navy/50 uppercase tracking-wider mb-2">
              Quick Select
            </div>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    onChange(preset.from, preset.to);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 text-xs font-sans rounded-lg text-left transition-colors ${
                    activePreset?.label === preset.label
                      ? 'bg-brand-red text-white'
                      : 'bg-gray-50 text-brand-navy hover:bg-brand-red/10'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom range */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs font-sans font-bold text-brand-navy/50 uppercase tracking-wider mb-2">
              Custom Range
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg font-sans"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg font-sans"
              />
            </div>
            <button
              onClick={() => {
                onChange(customFrom, customTo);
                setIsOpen(false);
              }}
              className="mt-2 w-full px-3 py-2 bg-brand-navy text-white text-xs font-sans font-bold rounded-lg hover:bg-brand-navy-light transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
