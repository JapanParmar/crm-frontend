'use client'

import React, { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  Phone,
  Mail,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
  CalendarPlus,
  PhoneCall,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatDate, formatCurrency, formatPhone } from '@/lib/utils'
import type { Lead } from '@/types'
import { LeadStatusBadge, LeadSourceBadge, PriorityBadge, LeadScore } from './LeadBadges'
import { Avatar } from '@/components/ui/avatar'
import { TableSkeleton, EmptyState } from '@/components/ui/skeleton'
import { Users } from 'lucide-react'

const columnHelper = createColumnHelper<Lead>()

function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (!direction) return <ChevronsUpDown className="w-3 h-3 text-muted-gray" />
  if (direction === 'asc') return <ChevronUp className="w-3 h-3 text-ink-black" />
  return <ChevronDown className="w-3 h-3 text-ink-black" />
}

interface RowMenuProps {
  lead: Lead
  onView?: (lead: Lead) => void
  onEdit?: (lead: Lead) => void
  onDelete?: (lead: Lead) => void
}

function RowMenu({ lead, onView, onEdit, onDelete }: RowMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="w-6 h-6 rounded-buttons flex items-center justify-center text-muted-gray hover:text-heading-charcoal hover:bg-stone-surface opacity-0 group-hover:opacity-100 transition-all duration-100"
        aria-label="Row actions"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 w-44 bg-white border border-stone-border rounded-cards z-20 py-1 text-xs shadow-subtle">
            {onView && (
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-stone-surface text-heading-charcoal"
                onClick={(e) => { e.stopPropagation(); onView(lead); setOpen(false) }}
              >
                <Eye className="w-3.5 h-3.5 text-muted-gray" /> View Details
              </button>
            )}
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-stone-surface text-heading-charcoal"
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
            >
              <PhoneCall className="w-3.5 h-3.5 text-muted-gray" /> Log Call
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-stone-surface text-heading-charcoal"
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
            >
              <CalendarPlus className="w-3.5 h-3.5 text-muted-gray" /> Schedule Follow-up
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-stone-surface text-heading-charcoal"
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
            >
              <UserPlus className="w-3.5 h-3.5 text-muted-gray" /> Reassign
            </button>
            {onEdit && (
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-stone-surface text-heading-charcoal"
                onClick={(e) => { e.stopPropagation(); onEdit(lead); setOpen(false) }}
              >
                <Pencil className="w-3.5 h-3.5 text-muted-gray" /> Edit
              </button>
            )}
            <div className="border-t border-stone-surface my-1" />
            {onDelete && (
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-alert-red/5 text-alert-red"
                onClick={(e) => { e.stopPropagation(); onDelete(lead); setOpen(false) }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Lead
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface LeadsTableProps {
  leads: Lead[]
  loading?: boolean
  selectedIds?: Set<string>
  onSelectChange?: (id: string) => void
  onSelectAll?: (selected: boolean) => void
  onView?: (lead: Lead) => void
  onEdit?: (lead: Lead) => void
  onDelete?: (lead: Lead) => void
}

export function LeadsTable({
  leads,
  loading = false,
  selectedIds = new Set(),
  onSelectChange,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
}: LeadsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      size: 36,
      header: ({ table }) => (
        <input
          type="checkbox"
          className="w-3.5 h-3.5 rounded-badges border border-stone-border accent-ink-black cursor-pointer"
          checked={table.getIsAllRowsSelected()}
          onChange={(e) => onSelectAll?.(e.target.checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="w-3.5 h-3.5 rounded-badges border border-stone-border accent-ink-black cursor-pointer"
          checked={selectedIds.has(row.original.id)}
          onChange={() => onSelectChange?.(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${row.original.name}`}
        />
      ),
    }),

    columnHelper.accessor('leadNumber', {
      id: 'leadNumber',
      header: 'Lead ID',
      size: 90,
      cell: (info) => (
        <span className="text-xs font-mono text-body-brown">{info.getValue()}</span>
      ),
    }),

    columnHelper.accessor('name', {
      id: 'name',
      header: 'Name',
      size: 180,
      cell: (info) => {
        const lead = info.row.original
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name={lead.name} size="xs" />
            <div className="min-w-0">
              <Link
                href={`/leads/${lead.id}`}
                className="text-xs font-medium text-heading-charcoal hover:text-ink-black hover:underline truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {lead.name}
              </Link>
              <p className="text-xs text-body-brown truncate">{formatPhone(lead.phone)}</p>
            </div>
          </div>
        )
      },
    }),

    columnHelper.accessor('source', {
      id: 'source',
      header: 'Source',
      size: 110,
      cell: (info) => <LeadSourceBadge source={info.getValue()} />,
    }),

    columnHelper.accessor('status', {
      id: 'status',
      header: 'Status',
      size: 120,
      cell: (info) => <LeadStatusBadge status={info.getValue()} dot />,
    }),

    columnHelper.accessor('priority', {
      id: 'priority',
      header: 'Priority',
      size: 90,
      cell: (info) => <PriorityBadge priority={info.getValue()} />,
    }),

    columnHelper.accessor('assignedToName', {
      id: 'assignedTo',
      header: 'Assigned',
      size: 130,
      cell: (info) => {
        const name = info.getValue()
        if (!name) return <span className="text-xs text-muted-gray">—</span>
        return (
          <div className="flex items-center gap-1.5">
            <Avatar name={name} size="xs" />
            <span className="text-xs text-body-brown truncate">{name.split(' ')[0]}</span>
          </div>
        )
      },
    }),

    columnHelper.accessor('budget', {
      id: 'budget',
      header: 'Budget',
      size: 100,
      cell: (info) => {
        const val = info.getValue()
        return <span className="text-xs text-heading-charcoal font-semibold">{val ? formatCurrency(val) : '—'}</span>
      },
    }),

    columnHelper.accessor('score', {
      id: 'score',
      header: 'Score',
      size: 100,
      cell: (info) => <LeadScore score={info.getValue()} />,
    }),

    columnHelper.accessor('nextFollowUp', {
      id: 'nextFollowUp',
      header: 'Next Follow-up',
      size: 110,
      cell: (info) => {
        const val = info.getValue()
        if (!val) return <span className="text-xs text-muted-gray">—</span>
        const d = new Date(val)
        const isOverdue = d < new Date()
        return (
          <span className={cn('text-xs', isOverdue ? 'text-alert-red font-semibold' : 'text-body-brown')}>
            {formatDate(val, 'relative')}
          </span>
        )
      },
    }),

    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      header: 'Created',
      size: 90,
      cell: (info) => (
        <span className="text-xs text-muted-gray">{formatDate(info.getValue(), 'short')}</span>
      ),
    }),

    columnHelper.display({
      id: 'actions',
      size: 60,
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          {/* Quick action icons */}
          <a
            href={`tel:${row.original.phone}`}
            className="w-5 h-5 rounded flex items-center justify-center text-muted-gray hover:text-ink-black hover:bg-stone-surface opacity-0 group-hover:opacity-100 transition-all duration-100"
            onClick={(e) => e.stopPropagation()}
            title="Call"
            aria-label="Call lead"
          >
            <Phone className="w-3 h-3" />
          </a>
          <a
            href={`https://wa.me/91${row.original.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-5 h-5 rounded flex items-center justify-center text-muted-gray hover:text-ink-black hover:bg-stone-surface opacity-0 group-hover:opacity-100 transition-all duration-100"
            onClick={(e) => e.stopPropagation()}
            title="WhatsApp"
            aria-label="WhatsApp lead"
          >
            <MessageSquare className="w-3 h-3" />
          </a>
          <RowMenu lead={row.original} onView={onView} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ),
    }),
  ], [selectedIds, onSelectChange, onSelectAll, onView, onEdit, onDelete])

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (loading) {
    return <TableSkeleton rows={10} cols={7} />
  }

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-10 h-10" />}
        title="No leads found"
        description="Add your first lead or adjust your filters to see results."
      />
    )
  }

  return (
    <div className="w-full overflow-x-auto bg-white">
      <table className="w-full text-xs">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-stone-surface bg-[#fcfbf9]">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                return (
                  <th
                     key={header.id}
                     style={{ width: header.getSize() }}
                     className={cn(
                       'px-3 py-2.5 text-left text-xs font-semibold text-body-brown whitespace-nowrap',
                       canSort && 'cursor-pointer hover:text-ink-black select-none'
                     )}
                     onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                   >
                     {header.isPlaceholder ? null : (
                       <div className="flex items-center gap-1">
                         {flexRender(header.column.columnDef.header, header.getContext())}
                         {canSort && <SortIcon direction={header.column.getIsSorted()} />}
                       </div>
                     )}
                   </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-stone-surface">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'group hover:bg-stone-surface/30 transition-colors duration-75 cursor-pointer',
                selectedIds.has(row.original.id) && 'bg-sun-yellow/10'
              )}
              onClick={() => onView?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                  className="px-3 py-2.5 whitespace-nowrap"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
