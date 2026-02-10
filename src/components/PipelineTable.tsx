'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import type { Prospect } from '@/types';
import { fmtCurrency, fmtPercent } from '@/lib/format';
import { DetailPanel } from './DetailPanel';

interface PipelineTableProps {
  pipeline: Prospect[];
}

export function PipelineTable({ pipeline }: PipelineTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'dealValue', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  const uniqueOwners = useMemo(() => [...new Set(pipeline.map((p) => p.owner).filter(Boolean))].sort(), [pipeline]);
  const uniqueStages = useMemo(() => [...new Set(pipeline.map((p) => p.stage).filter(Boolean))].sort(), [pipeline]);
  const uniqueStates = useMemo(() => [...new Set(pipeline.map((p) => p.state).filter(Boolean))].sort(), [pipeline]);
  const uniqueMDs = useMemo(() => [...new Set(pipeline.map((p) => p.marketingDirector).filter(Boolean))].sort(), [pipeline]);

  const [ownerFilter, setOwnerFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [mdFilter, setMdFilter] = useState('');

  const filteredData = useMemo(() => {
    let result = pipeline;
    if (ownerFilter) result = result.filter((p) => p.owner === ownerFilter);
    if (stageFilter) result = result.filter((p) => p.stage === stageFilter);
    if (stateFilter) result = result.filter((p) => p.state === stateFilter);
    if (mdFilter) result = result.filter((p) => p.marketingDirector === mdFilter);
    return result;
  }, [pipeline, ownerFilter, stageFilter, stateFilter, mdFilter]);

  const columns = useMemo<ColumnDef<Prospect>[]>(
    () => [
      {
        accessorKey: 'prospectName',
        header: 'Deal',
        cell: (info) => <span className="font-medium">{info.getValue() as string}</span>,
        size: 160,
      },
      {
        accessorKey: 'dealValue',
        header: 'Deal Value',
        cell: (info) => fmtCurrency(info.getValue() as number),
        size: 120,
      },
      {
        accessorKey: 'owner',
        header: 'Owner',
        size: 130,
      },
      {
        accessorKey: 'state',
        header: 'State',
        size: 110,
      },
      {
        accessorKey: 'stage',
        header: 'Stage',
        size: 130,
      },
      {
        accessorKey: 'chanceOfClose',
        header: 'Close %',
        cell: (info) => fmtPercent(info.getValue() as number),
        size: 80,
      },
      {
        accessorKey: 'chanceNext30',
        header: '30-Day %',
        cell: (info) => fmtPercent(info.getValue() as number),
        size: 80,
      },
      {
        accessorKey: 'chanceNext60',
        header: '60-Day %',
        cell: (info) => fmtPercent(info.getValue() as number),
        size: 80,
      },
      {
        accessorKey: 'expectedCloseMonth',
        header: 'Exp Close',
        size: 90,
      },
      {
        accessorKey: 'pipeline',
        header: 'Temp',
        cell: (info) => {
          const val = (info.getValue() as string).toLowerCase();
          const colors: Record<string, string> = {
            hot: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            warm: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
            cold: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          };
          return (
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colors[val] ?? 'bg-gray-100 text-gray-800'}`}>
              {info.getValue() as string}
            </span>
          );
        },
        size: 70,
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Pipeline Details
      </h2>

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        {/* Filters bar */}
        <div className="p-3 border-b flex flex-wrap gap-2" style={{ borderColor: 'var(--border-color)' }}>
          <input
            type="text"
            placeholder="Search deals..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm flex-1 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-brand-red/30"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
          <FilterSelect label="Owner" value={ownerFilter} options={uniqueOwners} onChange={setOwnerFilter} />
          <FilterSelect label="Stage" value={stageFilter} options={uniqueStages} onChange={setStageFilter} />
          <FilterSelect label="State" value={stateFilter} options={uniqueStates} onChange={setStateFilter} />
          <FilterSelect label="MD" value={mdFilter} options={uniqueMDs} onChange={setMdFilter} />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none hover:bg-brand-red/5 whitespace-nowrap"
                      style={{ color: 'var(--text-muted)', width: header.getSize() }}
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
                <tr
                  key={row.id}
                  className="border-b cursor-pointer transition-colors hover:bg-brand-red/5"
                  style={{ borderColor: 'var(--border-color)' }}
                  onClick={() => setSelectedProspect(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    No deals found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-2 text-xs text-right" style={{ color: 'var(--text-muted)' }}>
          {filteredData.length} deal{filteredData.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Detail panel */}
      {selectedProspect && (
        <DetailPanel prospect={selectedProspect} onClose={() => setSelectedProspect(null)} />
      )}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
    >
      <option value="">All {label}s</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
