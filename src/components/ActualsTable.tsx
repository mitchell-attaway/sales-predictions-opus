'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import type { Actual } from '@/types';
import { fmtCurrency } from '@/lib/format';

interface ActualsTableProps {
  actuals: Actual[];
  actualsDetected: boolean;
}

export function ActualsTable({ actuals, actualsDetected }: ActualsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'dealValue', desc: true }]);

  const columns = useMemo<ColumnDef<Actual>[]>(
    () => [
      {
        accessorKey: 'partnerName',
        header: 'Partner',
        cell: (info) => <span className="font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'dealValue',
        header: 'Deal Value',
        cell: (info) => fmtCurrency(info.getValue() as number),
      },
      {
        accessorKey: 'salesperson',
        header: 'Salesperson',
      },
      {
        accessorKey: 'state',
        header: 'State',
      },
      {
        accessorKey: 'stage',
        header: 'Stage',
      },
    ],
    []
  );

  const table = useReactTable({
    data: actuals,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!actualsDetected) {
    return (
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          Closed Deals (Actuals)
        </h2>
        <div className="rounded-xl border p-6 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Actuals section not detected in this month&apos;s data.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Closed Deals (Actuals)
      </h2>
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none hover:bg-brand-red/5 whitespace-nowrap"
                      style={{ color: 'var(--text-muted)' }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? ' \u2191' : header.column.getIsSorted() === 'desc' ? ' \u2193' : ''}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {actuals.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    No closed deals this month
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-2 text-xs text-right" style={{ color: 'var(--text-muted)' }}>
          {actuals.length} closed deal{actuals.length !== 1 ? 's' : ''} &middot; Total: {fmtCurrency(actuals.reduce((s, a) => s + a.dealValue, 0))}
        </div>
      </div>
    </section>
  );
}
