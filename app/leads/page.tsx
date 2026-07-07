'use client'

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createColumnHelper } from '@tanstack/react-table'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { leadsApi, usersApi } from '@/lib/api'
import type { ApiLead } from '@/lib/api'
import { LeadStatusBadge, LeadSourceBadge, LeadPriorityBadge, LeadScore } from '@/components/leads/LeadBadges'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Search, UserPlus, Phone, MessageSquare } from 'lucide-react'
import Link from 'next/link'

type Tab = 'all' | 'my' | 'unassigned' | 'today'

const columnHelper = createColumnHelper<ApiLead>()

export default function LeadsPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const { user } = useAuthStore()
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('superadmin') || false
  const queryClient = useQueryClient()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Bulk assignment state using TanStack RowSelectionState
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v)
    setPage(1)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setDebouncedSearch(v), 400)
  }, [])

  const queryParams = {
    tab: activeTab,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
    priority: priorityFilter || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    limit: 25,
    sort_by: 'created_at',
    sort_dir: 'desc' as const,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['leads', queryParams],
    queryFn: () => leadsApi.list(queryParams).then((r) => r.data),
  })

  const { data: countsData } = useQuery({
    queryKey: ['leads-counts'],
    queryFn: () => leadsApi.counts().then((r) => r.data.data),
  })

  // Load employees for bulk assignment
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.employees().then((r) => r.data.data),
    enabled: !!user?.access?.assign_leads,
  })

  // Selected lead IDs derived from rowSelection state
  const selectedLeadIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map(Number)
  }, [rowSelection])

  // Bulk assign mutation
  const bulkAssignMutation = useMutation({
    mutationFn: (assignedTo: number | null) =>
      leadsApi.bulkAssign({ lead_ids: selectedLeadIds, assigned_to: assignedTo }),
    onSuccess: (res) => {
      setAlert({ type: 'success', message: res.data.message || 'Leads assigned successfully!' })
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads-counts'] })
      setTimeout(() => setAlert(null), 4000)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Failed to assign leads.'
      setAlert({ type: 'error', message: msg })
      setTimeout(() => setAlert(null), 4000)
    },
  })

  const leads = data?.data ?? []
  const meta = data?.meta
  const counts = countsData

  const tabs = [
    { label: 'All Leads', value: 'all', count: counts?.all },
    ...(isAdmin ? [{ label: 'Unassigned', value: 'unassigned', count: counts?.unassigned }] : []),
    { label: 'My Leads', value: 'my', count: counts?.my },
    { label: 'Added Today', value: 'today', count: counts?.today },
  ]

  const STATUSES = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'closed_won', 'closed_lost', 'on_hold']
  const SOURCES = ['magicbricks', '99acres', 'housing', 'meta_ads', 'google_ads', 'website', 'whatsapp', 'referral', 'walk_in', 'instagram']
  const PRIORITIES = ['low', 'medium', 'high', 'urgent']

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab)
    setPage(1)
    setRowSelection({}) // clear select on tab change
  }

  // Column definitions for the DataTable component
  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Lead',
      cell: ({ row }) => {
        const lead = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar name={lead.name} size="xs" />
            <div>
              <Link
                href={`/leads/${lead.id}`}
                className="font-bold text-heading-charcoal hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {lead.name}
              </Link>
              <p className="text-[10px] text-body-brown">
                {lead.phone} · <span className="text-muted-gray">{lead.lead_number}</span>
              </p>
            </div>
          </div>
        )
      },
    }),

    columnHelper.accessor('source', {
      header: 'Source',
      meta: { className: 'hidden sm:table-cell' },
      cell: (info) => <LeadSourceBadge source={info.getValue() as never} />,
    }),

    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => <LeadStatusBadge status={info.getValue() as never} dot />,
    }),

    columnHelper.accessor('priority', {
      header: 'Priority',
      meta: { className: 'hidden md:table-cell' },
      cell: (info) => <LeadPriorityBadge priority={info.getValue() as never} />,
    }),

    columnHelper.accessor('assigned_to', {
      header: 'Assigned To',
      meta: { className: 'hidden lg:table-cell' },
      cell: ({ row }) => {
        const assigned = row.original.assigned_to
        if (!assigned) return <span className="text-muted-gray italic">Unassigned</span>
        return (
          <div className="flex items-center gap-1.5">
            <Avatar name={assigned.name} size="xs" />
            <span className="text-body-brown truncate max-w-[100px]">{assigned.name}</span>
          </div>
        )
      },
    }),

    columnHelper.accessor('budget_max', {
      header: 'Budget',
      meta: { className: 'hidden lg:table-cell font-semibold text-heading-charcoal' },
      cell: (info) => (info.getValue() ? formatCurrency(info.getValue() as number) : '—'),
    }),

    columnHelper.accessor('score', {
      header: 'Score',
      meta: { className: 'hidden xl:table-cell' },
      cell: (info) => <LeadScore score={info.getValue()} />,
    }),

    columnHelper.accessor('created_at', {
      header: 'Created',
      meta: { className: 'hidden xl:table-cell text-body-brown' },
      cell: (info) => formatDate(info.getValue(), 'short'),
    }),

    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const lead = row.original
        return (
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <a
              href={`tel:${lead.phone}`}
              className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black"
              title="Call"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
            <a
              href={`https://wa.me/91${lead.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black"
              title="WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </a>
          </div>
        )
      },
    }),
  ], [])

  return (
    <AppShell>
      <AppHeader title="Leads" subtitle="Manage your lead pipeline" />
      <AddLeadModal
        open={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['leads'] })
          queryClient.invalidateQueries({ queryKey: ['leads-counts'] })
        }}
      />

      <main className="flex flex-col h-full bg-cream-canvas relative" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10 flex-shrink-0">
          <PageHeader
            title="Leads"
            description={meta ? `${meta.total.toLocaleString()} total leads` : 'Loading…'}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            actions={
              user?.permissions?.includes('create-leads') && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<UserPlus className="w-3.5 h-3.5" />}
                  onClick={() => setAddLeadOpen(true)}
                >
                  Add Lead
                </Button>
              )
            }
          />

          {/* Alert Notification */}
          {alert && (
            <div
              className={`p-3 text-xs font-semibold border-b flex items-center justify-between transition-all duration-300 ${
                alert.type === 'success'
                  ? 'bg-grass-green/10 border-grass-green/20 text-grass-green'
                  : 'bg-alert-red/10 border-alert-red/20 text-alert-red'
              }`}
            >
              <span>{alert.message}</span>
              <button
                onClick={() => setAlert(null)}
                className="text-[10px] uppercase tracking-wider font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Filters Row */}
          <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-gray" />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search name, phone, lead ID…"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-stone-border bg-white text-xs focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
                setRowSelection({})
              }}
              className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer"
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>

            {/* Source filter */}
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value)
                setPage(1)
                setRowSelection({})
              }}
              className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer"
            >
              <option value="">All Sources</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setPage(1)
                setRowSelection({})
              }}
              className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer"
            >
              <option value="">All Priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>

            {/* Created From date picker */}
            <div className="flex items-center gap-1.5 bg-white border border-stone-border rounded-lg h-9 px-2.5">
              <span className="text-[10px] uppercase font-bold text-muted-gray">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                className="bg-transparent border-none text-xs text-body-brown focus:outline-none cursor-pointer"
              />
            </div>

            {/* Created To date picker */}
            <div className="flex items-center gap-1.5 bg-white border border-stone-border rounded-lg h-9 px-2.5">
              <span className="text-[10px] uppercase font-bold text-muted-gray">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="bg-transparent border-none text-xs text-body-brown focus:outline-none cursor-pointer"
              />
            </div>

            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  setPage(1)
                }}
                className="text-[10px] font-bold text-alert-red hover:underline uppercase tracking-wider pl-1"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>

        {/* Reusable DataTable Component */}
        <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
          <DataTable
            columns={columns}
            data={leads}
            loading={isLoading}
            getRowId={(row) => row.id.toString()}
            enableSelection={!!user?.access?.assign_leads}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            pageIndex={page - 1}
            pageSize={25}
            pageCount={meta?.total_pages}
            totalCount={meta?.total}
            onPageChange={(idx) => setPage(idx + 1)}
            onRowClick={(lead) => router.push(`/leads/${lead.id}`)}
            emptyTitle="No leads found"
            emptyDescription="Add your first lead or adjust your filters to see results."
          />
        </div>

        {/* Floating Bulk Assignment Bar */}
        {selectedLeadIds.length > 0 && user?.access?.assign_leads && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e1d1b] text-white px-5 py-3.5 rounded-2xl shadow-premium border border-stone-border/20 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <span className="text-xs font-bold whitespace-nowrap">{selectedLeadIds.length} leads selected</span>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-stone-surface">Assign To:</span>
              <select
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'none') {
                    bulkAssignMutation.mutate(null)
                  } else if (val) {
                    bulkAssignMutation.mutate(parseInt(val))
                  }
                }}
                disabled={bulkAssignMutation.isPending}
                defaultValue=""
                className="h-8 px-2 rounded-lg border border-white/20 bg-stone-surface/10 text-white text-xs focus:outline-none focus:border-white cursor-pointer"
              >
                <option value="" className="text-heading-charcoal">
                  Select Employee...
                </option>
                <option value="none" className="text-heading-charcoal">
                  Unassign All
                </option>
                {(employeesData ?? []).map((emp) => (
                  <option key={emp.id} value={emp.id} className="text-heading-charcoal">
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setRowSelection({})}
              className="text-[10px] font-bold text-[#e6e2dd] hover:text-white uppercase tracking-wider transition-colors ml-2"
            >
              Cancel
            </button>
          </div>
        )}
      </main>
    </AppShell>
  )
}

