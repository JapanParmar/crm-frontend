'use client'

import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { formatDate, formatCurrency } from '@/lib/utils'
import { Search, SlidersHorizontal, UserPlus, Phone, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Tab = 'all' | 'my' | 'unassigned' | 'today'

export default function LeadsPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const { user } = useAuthStore()
  const isAdmin = user?.roles?.includes('admin') ?? false
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  // Bulk assignment state
  const [selectedLeads, setSelectedLeads] = useState<number[]>([])
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)
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

  // Bulk assign mutation
  const bulkAssignMutation = useMutation({
    mutationFn: (assignedTo: number | null) =>
      leadsApi.bulkAssign({ lead_ids: selectedLeads, assigned_to: assignedTo }),
    onSuccess: (res) => {
      setAlert({ type: 'success', message: res.data.message || 'Leads assigned successfully!' })
      setSelectedLeads([])
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
    setSelectedLeads([]) // clear select on tab change
  }

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
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10">
          <PageHeader
            title="Leads"
            description={meta ? `${meta.total.toLocaleString()} total leads` : 'Loading…'}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            actions={
              <Button variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setAddLeadOpen(true)}>
                Add Lead
              </Button>
            }
          />

          {/* Alert Notification */}
          {alert && (
            <div className={`p-3 text-xs font-semibold border-b flex items-center justify-between transition-all duration-300 ${
              alert.type === 'success'
                ? 'bg-grass-green/10 border-grass-green/20 text-grass-green'
                : 'bg-alert-red/10 border-alert-red/20 text-alert-red'
            }`}>
              <span>{alert.message}</span>
              <button onClick={() => setAlert(null)} className="text-[10px] uppercase tracking-wider font-bold hover:underline">Dismiss</button>
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
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setSelectedLeads([]) }}
              className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer"
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
            </select>

            {/* Source filter */}
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); setSelectedLeads([]) }}
              className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer"
            >
              <option value="">All Sources</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
            </select>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); setSelectedLeads([]) }}
              className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer"
            >
              <option value="">All Priority</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto pb-16">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#f7f6f3] border-b border-stone-surface">
                {user?.access?.assign_leads && (
                  <th className="px-4 py-2.5 text-left w-10">
                    <input
                      type="checkbox"
                      checked={leads.length > 0 && selectedLeads.length === leads.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeads(leads.map((l) => l.id))
                        } else {
                          setSelectedLeads([])
                        }
                      }}
                      className="w-3.5 h-3.5 rounded border-stone-border text-ink-black focus:ring-ink-black cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-4 py-2.5 text-left font-bold text-heading-charcoal">Lead</th>
                <th className="px-3 py-2.5 text-left font-bold text-heading-charcoal hidden sm:table-cell">Source</th>
                <th className="px-3 py-2.5 text-left font-bold text-heading-charcoal">Status</th>
                <th className="px-3 py-2.5 text-left font-bold text-heading-charcoal hidden md:table-cell">Priority</th>
                <th className="px-3 py-2.5 text-left font-bold text-heading-charcoal hidden lg:table-cell">Assigned To</th>
                <th className="px-3 py-2.5 text-left font-bold text-heading-charcoal hidden lg:table-cell">Budget</th>
                <th className="px-3 py-2.5 text-left font-bold text-heading-charcoal hidden xl:table-cell">Score</th>
                <th className="px-3 py-2.5 text-left font-bold text-heading-charcoal hidden xl:table-cell">Created</th>
                <th className="px-3 py-2.5 text-left font-bold text-heading-charcoal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-surface bg-white">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: user?.access?.assign_leads ? 10 : 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-stone-surface rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={user?.access?.assign_leads ? 10 : 9} className="px-4 py-16 text-center text-muted-gray">
                    No leads found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead: ApiLead) => (
                  <tr key={lead.id} className="hover:bg-[#fcfbf9] cursor-pointer group transition-colors duration-75">
                    {user?.access?.assign_leads && (
                      <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads((prev) => [...prev, lead.id])
                            } else {
                              setSelectedLeads((prev) => prev.filter((id) => id !== lead.id))
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-stone-border text-ink-black focus:ring-ink-black cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={lead.name} size="xs" />
                        <div>
                          <Link href={`/leads/${lead.id}`} className="font-bold text-heading-charcoal hover:underline">
                            {lead.name}
                          </Link>
                          <p className="text-[10px] text-body-brown">{lead.phone} · <span className="text-muted-gray">{lead.lead_number}</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <LeadSourceBadge source={lead.source as never} />
                    </td>
                    <td className="px-3 py-3">
                      <LeadStatusBadge status={lead.status as never} dot />
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <LeadPriorityBadge priority={lead.priority as never} />
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      {lead.assigned_to ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={lead.assigned_to.name} size="xs" />
                          <span className="text-body-brown truncate max-w-[100px]">{lead.assigned_to.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-gray italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell font-semibold text-heading-charcoal">
                      {lead.budget_max ? formatCurrency(lead.budget_max) : '—'}
                    </td>
                    <td className="px-3 py-3 hidden xl:table-cell">
                      <LeadScore score={lead.score} />
                    </td>
                    <td className="px-3 py-3 hidden xl:table-cell text-body-brown">
                      {formatDate(lead.created_at, 'short')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={`tel:${lead.phone}`} className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black" title="Call">
                          <Phone className="w-3 h-3" />
                        </a>
                        <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black" title="WhatsApp">
                          <MessageSquare className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Floating Bulk Assignment Bar */}
        {selectedLeads.length > 0 && user?.access?.assign_leads && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e1d1b] text-white px-5 py-3.5 rounded-2xl shadow-premium border border-stone-border/20 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <span className="text-xs font-bold whitespace-nowrap">{selectedLeads.length} leads selected</span>
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
                <option value="" className="text-heading-charcoal">Select Employee...</option>
                <option value="none" className="text-heading-charcoal">Unassign All</option>
                {(employeesData ?? []).map((emp) => (
                  <option key={emp.id} value={emp.id} className="text-heading-charcoal">
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setSelectedLeads([])}
              className="text-[10px] font-bold text-[#e6e2dd] hover:text-white uppercase tracking-wider transition-colors ml-2"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.total_pages > 1 && (
          <div className="border-t border-stone-surface bg-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-body-brown">
              Page {meta.page} of {meta.total_pages} · {meta.total} leads
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-stone-border text-body-brown hover:text-ink-black hover:bg-stone-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(5, meta.total_pages) }, (_, i) => {
                const p = Math.max(1, Math.min(meta.total_pages - 4, page - 2)) + i
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded text-xs font-semibold border transition-colors ${
                      p === page
                        ? 'bg-ink-black text-white border-ink-black'
                        : 'border-stone-border text-body-brown hover:bg-stone-surface'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                disabled={page === meta.total_pages}
                className="p-1.5 rounded border border-stone-border text-body-brown hover:text-ink-black hover:bg-stone-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  )
}
