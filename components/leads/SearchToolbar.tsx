'use client'

import React from 'react'
import { Search, Filter, SlidersHorizontal, X, Download, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, IconButton } from '@/components/ui/button'
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from '@/lib/constants'
import type { LeadFilters, LeadStatus, LeadSource } from '@/types'

interface SearchToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  filters: LeadFilters
  onFiltersChange: (filters: LeadFilters) => void
  onReset: () => void
  resultCount?: number
  selectedCount?: number
  onBulkDelete?: () => void
  onBulkAssign?: () => void
  onExport?: () => void
  onRefresh?: () => void
  loading?: boolean
}

const STATUS_OPTIONS: LeadStatus[] = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'closed_won', 'closed_lost', 'on_hold']
const SOURCE_OPTIONS: LeadSource[] = ['magicbricks', '99acres', 'housing', 'meta_ads', 'google_ads', 'website', 'whatsapp', 'referral', 'walk_in', 'facebook', 'instagram']

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-6 pl-3 pr-1.5 rounded-pills text-xs font-semibold bg-stone-surface text-heading-charcoal border border-stone-border">
      {label}
      <button
        onClick={onRemove}
        className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-cream-canvas transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-2.5 h-2.5 text-body-brown" />
      </button>
    </span>
  )
}

export function SearchToolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  onReset,
  resultCount,
  selectedCount = 0,
  onBulkDelete,
  onBulkAssign,
  onExport,
  onRefresh,
  loading,
}: SearchToolbarProps) {
  const [showFilters, setShowFilters] = React.useState(false)

  const activeFilterCount = [
    ...(filters.status || []),
    ...(filters.source || []),
    ...(filters.priority || []),
    ...(filters.assignedTo || []),
  ].length

  const removeStatus = (s: LeadStatus) =>
    onFiltersChange({ ...filters, status: (filters.status || []).filter((x) => x !== s) })
  const removeSource = (s: LeadSource) =>
    onFiltersChange({ ...filters, source: (filters.source || []).filter((x) => x !== s) })

  return (
    <div className="flex flex-col gap-0 border-b border-stone-surface bg-[#fcfbf9]">
      {/* Main toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-body-brown pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-stone-border bg-white text-xs text-heading-charcoal placeholder:text-muted-gray focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black transition-shadow"
            aria-label="Search leads"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-body-brown hover:text-ink-black"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant={showFilters || activeFilterCount > 0 ? 'secondary' : 'ghost'}
          size="sm"
          icon={<Filter className="w-3.5 h-3.5" />}
          onClick={() => setShowFilters(!showFilters)}
          className={cn(activeFilterCount > 0 && 'text-ink-black')}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-sun-yellow/20 text-gold rounded-full font-semibold border border-stone-border">
              {activeFilterCount}
            </span>
          )}
        </Button>

        <div className="flex-1" />

        {/* Result count */}
        {resultCount !== undefined && (
          <span className="text-xs text-body-brown">{resultCount} leads</span>
        )}

        {/* Bulk actions */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 pl-2 border-l border-stone-border">
            <span className="text-xs text-heading-charcoal font-semibold">{selectedCount} selected</span>
            {onBulkAssign && (
              <Button variant="outline" size="sm" onClick={onBulkAssign}>Assign</Button>
            )}
            {onBulkDelete && (
              <Button variant="outline" size="sm" className="text-alert-red border-alert-red hover:bg-alert-red/5" onClick={onBulkDelete}>
                Delete
              </Button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onExport && (
            <IconButton icon={<Download className="w-3.5 h-3.5" />} tooltip="Export CSV" onClick={onExport} />
          )}
          {onRefresh && (
            <IconButton
              icon={<RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />}
              tooltip="Refresh"
              onClick={onRefresh}
            />
          )}
        </div>
      </div>

      {/* Active filter pills */}
      {(activeFilterCount > 0 || filters.status?.length || filters.source?.length) && (
        <div className="flex items-center gap-1.5 px-4 pb-2.5 flex-wrap">
          {(filters.status || []).map((s) => (
            <FilterPill key={s} label={LEAD_STATUS_LABELS[s]} onRemove={() => removeStatus(s)} />
          ))}
          {(filters.source || []).map((s) => (
            <FilterPill key={s} label={LEAD_SOURCE_LABELS[s]} onRemove={() => removeSource(s)} />
          ))}
          <button
            onClick={onReset}
            className="text-xs text-body-brown hover:text-ink-black underline transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="px-4 pb-4 border-t border-stone-surface pt-3 bg-stone-surface/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Status filter */}
            <div>
              <p className="text-xs font-semibold text-body-brown mb-1.5">Status</p>
              <div className="flex flex-wrap gap-1">
                {STATUS_OPTIONS.map((status) => {
                  const active = (filters.status || []).includes(status)
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        const current = filters.status || []
                        onFiltersChange({
                          ...filters,
                          status: active ? current.filter((s) => s !== status) : [...current, status],
                        })
                      }}
                      className={cn(
                        'px-2.5 py-0.5 rounded-badges text-xs font-semibold border transition-all duration-100',
                        active
                          ? 'bg-ink-black text-cream-canvas border-ink-black'
                          : 'bg-white text-body-brown border-stone-border hover:bg-stone-surface hover:text-ink-black'
                      )}
                    >
                      {LEAD_STATUS_LABELS[status]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Source filter */}
            <div>
              <p className="text-xs font-semibold text-body-brown mb-1.5">Source</p>
              <div className="flex flex-wrap gap-1">
                {SOURCE_OPTIONS.slice(0, 8).map((source) => {
                  const active = (filters.source || []).includes(source)
                  return (
                    <button
                      key={source}
                      onClick={() => {
                        const current = filters.source || []
                        onFiltersChange({
                          ...filters,
                          source: active ? current.filter((s) => s !== source) : [...current, source],
                        })
                      }}
                      className={cn(
                        'px-2.5 py-0.5 rounded-badges text-xs font-semibold border transition-all duration-100',
                        active
                          ? 'bg-ink-black text-cream-canvas border-ink-black'
                          : 'bg-white text-body-brown border-stone-border hover:bg-stone-surface hover:text-ink-black'
                      )}
                    >
                      {LEAD_SOURCE_LABELS[source]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Priority filter */}
            <div>
              <p className="text-xs font-semibold text-body-brown mb-1.5">Priority</p>
              <div className="flex flex-wrap gap-1">
                {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => {
                  const active = (filters.priority || []).includes(priority)
                  return (
                    <button
                      key={priority}
                      onClick={() => {
                        const current = filters.priority || []
                        onFiltersChange({
                          ...filters,
                          priority: active ? current.filter((p) => p !== priority) : [...current, priority],
                        })
                      }}
                      className={cn(
                        'px-2.5 py-0.5 rounded-badges text-xs font-semibold border capitalize transition-all duration-100',
                        active
                          ? 'bg-ink-black text-cream-canvas border-ink-black'
                          : 'bg-white text-body-brown border-stone-border hover:bg-stone-surface hover:text-ink-black'
                      )}
                    >
                      {priority}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Pagination component
interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }: PaginationProps) {
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-stone-surface bg-cream-canvas">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-body-brown">Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="h-6 px-2 text-xs rounded-lg border border-stone-border bg-white text-heading-charcoal focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black"
          aria-label="Rows per page"
        >
          {[25, 50, 100].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="text-xs text-body-brown">
          {start}–{end} of {total}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
        >
          «
        </Button>
        <Button
          variant="ghost"
          size="xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ‹
        </Button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum = i + 1
          if (totalPages > 5) {
            if (page <= 3) pageNum = i + 1
            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
            else pageNum = page - 2 + i
          }
          return (
            <Button
              key={pageNum}
              variant={page === pageNum ? 'primary' : 'ghost'}
              size="xs"
              onClick={() => onPageChange(pageNum)}
              aria-label={`Page ${pageNum}`}
              aria-current={page === pageNum ? 'page' : undefined}
            >
              {pageNum}
            </Button>
          )
        })}

        <Button
          variant="ghost"
          size="xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          ›
        </Button>
        <Button
          variant="ghost"
          size="xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
        >
          »
        </Button>
      </div>
    </div>
  )
}
