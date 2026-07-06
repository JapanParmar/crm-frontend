'use client'

import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type OnChangeFn,
  type Row,
} from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableSkeleton, EmptyState } from '@/components/ui/skeleton'

// Extend ColumnDef interface to support meta.className
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    className?: string
  }
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  loading?: boolean
  
  // Custom row ID accessor (crucial for controlled selection)
  getRowId?: (row: TData, index: number, parent?: Row<TData>) => string
  
  // Sorting (controlled or uncontrolled)
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  
  // Selection
  enableSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  
  // Pagination (controlled or uncontrolled)
  pageIndex?: number // 0-indexed
  pageSize?: number
  pageCount?: number
  totalCount?: number
  onPageChange?: (pageIndex: number) => void
  
  // Callbacks
  onRowClick?: (row: TData) => void
  
  // Custom states
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: React.ReactNode
  
  // Styling
  className?: string
  rowClassName?: string | ((row: TData) => string)
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (!direction) return <ChevronsUpDown className="w-3.5 h-3.5 text-muted-gray" />
  if (direction === 'asc') return <ChevronUp className="w-3.5 h-3.5 text-ink-black animate-in fade-in duration-200" />
  return <ChevronDown className="w-3.5 h-3.5 text-ink-black animate-in fade-in duration-200" />
}

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  getRowId,
  sorting: controlledSorting,
  onSortingChange: controlledOnSortingChange,
  enableSelection = false,
  rowSelection,
  onRowSelectionChange,
  pageIndex,
  pageSize,
  pageCount,
  totalCount,
  onPageChange,
  onRowClick,
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting your filters or search query.',
  emptyIcon,
  className,
  rowClassName,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([])

  const isControlledSorting = controlledSorting !== undefined
  const currentSorting = isControlledSorting ? controlledSorting : internalSorting
  const handleSortingChange = isControlledSorting ? controlledOnSortingChange : setInternalSorting

  const hasPagination = pageIndex !== undefined && pageSize !== undefined && pageCount !== undefined

  // Prepend selection checkbox column if enableSelection is true
  const computedColumns = React.useMemo(() => {
    if (!enableSelection) return columns

    const selectColumn: ColumnDef<TData, any> = {
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <input
          type="checkbox"
          className="w-3.5 h-3.5 rounded border border-stone-border accent-ink-black cursor-pointer bg-white"
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate' as any)}
          onChange={(e) => {
            table.toggleAllPageRowsSelected(e.target.checked)
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="w-3.5 h-3.5 rounded border border-stone-border accent-ink-black cursor-pointer bg-white"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={(e) => {
            row.toggleSelected(e.target.checked)
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select row`}
        />
      ),
    }

    return [selectColumn, ...columns] as ColumnDef<TData, any>[]
  }, [columns, enableSelection])

  const table = useReactTable({
    data,
    columns: computedColumns,
    state: {
      sorting: currentSorting,
      rowSelection: rowSelection ?? {},
    },
    getRowId: getRowId || ((row: any) => row.id?.toString()),
    onSortingChange: handleSortingChange,
    onRowSelectionChange: onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: hasPagination,
    pageCount: pageCount,
  })

  if (loading) {
    return (
      <div className="bg-white border border-stone-surface rounded-cards overflow-hidden">
        <TableSkeleton rows={10} cols={computedColumns.length} />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white border border-stone-surface rounded-cards p-8">
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    )
  }

  const activePage = pageIndex !== undefined ? pageIndex + 1 : 1

  return (
    <div className={cn("w-full flex flex-col h-full", className)}>
      <div className="flex-1 overflow-auto bg-white border border-stone-surface rounded-cards">
        <table className="w-full text-xs">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-stone-surface bg-[#fcfbf9] sticky top-0 z-10">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const metaClass = header.column.columnDef.meta?.className
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn(
                        'px-4 py-2.5 text-left text-xs font-semibold text-body-brown whitespace-nowrap',
                        canSort && 'cursor-pointer hover:text-ink-black select-none',
                        metaClass
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
          <tbody className="divide-y divide-stone-surface bg-white">
            {table.getRowModel().rows.map((row) => {
              const metaRowClass = typeof rowClassName === 'function' ? rowClassName(row.original) : rowClassName
              const isSelected = row.getIsSelected()
              return (
                <tr
                  key={row.id}
                  className={cn(
                    'group hover:bg-stone-surface/30 transition-colors duration-75 cursor-pointer',
                    isSelected && 'bg-sun-yellow/10',
                    metaRowClass
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const metaClass = cell.column.columnDef.meta?.className
                    return (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={cn("px-4 py-3 whitespace-nowrap align-middle", metaClass)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {hasPagination && pageCount && pageCount > 1 && (
        <div className="border-t border-stone-surface bg-white px-4 py-3.5 flex items-center justify-between mt-4 rounded-cards border">
          <p className="text-xs text-body-brown">
            Page {activePage} of {pageCount} {totalCount !== undefined && `· ${totalCount.toLocaleString()} items`}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange?.(pageIndex - 1)}
              disabled={pageIndex === 0}
              className="p-1.5 rounded-buttons border border-stone-border text-body-brown hover:text-ink-black hover:bg-stone-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Pagination window */}
            {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
              const startPage = Math.max(0, Math.min(pageCount - 5, pageIndex - 2))
              const pIndex = startPage + i
              const pNumber = pIndex + 1
              if (pIndex < 0 || pIndex >= pageCount) return null
              return (
                <button
                  key={pIndex}
                  onClick={() => onPageChange?.(pIndex)}
                  className={cn(
                    'w-7.5 h-7.5 rounded-buttons text-xs font-semibold border transition-colors',
                    pIndex === pageIndex
                      ? 'bg-ink-black text-white border-ink-black'
                      : 'border-stone-border text-body-brown hover:bg-stone-surface'
                  )}
                >
                  {pNumber}
                </button>
              )
            })}

            <button
              onClick={() => onPageChange?.(pageIndex + 1)}
              disabled={pageIndex === pageCount - 1}
              className="p-1.5 rounded-buttons border border-stone-border text-body-brown hover:text-ink-black hover:bg-stone-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
