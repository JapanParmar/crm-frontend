'use client'

import React, { useState, useMemo } from 'react'
import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { LeadsTable } from '@/components/leads/LeadsTable'
import { SearchToolbar, Pagination } from '@/components/leads/SearchToolbar'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { generateMockLeads } from '@/lib/constants'
import type { Lead, LeadFilters } from '@/types'
import { useRouter } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { IconButton } from '@/components/ui/button'

const ALL_LEADS = generateMockLeads(120)

const LIMIT = 25

export default function LeadsPage() {
  const router = useRouter()
  const { addLeadOpen, setAddLeadOpen, selectedLeadIds, toggleLeadSelection, clearLeadSelection } = useAppStore()

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<LeadFilters>({})
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(LIMIT)
  const [activeTab, setActiveTab] = useState('all')

  const filteredLeads = useMemo(() => {
    let leads = ALL_LEADS

    // Tab filter
    if (activeTab === 'my') {
      leads = leads.filter((l) => l.assignedTo === 'emp1')
    } else if (activeTab === 'unassigned') {
      leads = leads.filter((l) => !l.assignedTo)
    } else if (activeTab === 'today') {
      const today = new Date().toDateString()
      leads = leads.filter((l) => new Date(l.createdAt).toDateString() === today)
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          l.leadNumber.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      leads = leads.filter((l) => filters.status!.includes(l.status))
    }

    // Source filter
    if (filters.source && filters.source.length > 0) {
      leads = leads.filter((l) => filters.source!.includes(l.source))
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      leads = leads.filter((l) => filters.priority!.includes(l.priority))
    }

    return leads
  }, [search, filters, activeTab])

  const totalPages = Math.ceil(filteredLeads.length / limit)
  const paginatedLeads = filteredLeads.slice((page - 1) * limit, page * limit)

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    ALL_LEADS.forEach((l) => {
      counts[l.status] = (counts[l.status] || 0) + 1
    })
    return counts
  }, [])

  const tabs = [
    { label: 'All Leads', value: 'all', count: ALL_LEADS.length },
    { label: 'My Leads', value: 'my', count: ALL_LEADS.filter((l) => l.assignedTo === 'emp1').length },
    { label: 'Unassigned', value: 'unassigned', count: ALL_LEADS.filter((l) => !l.assignedTo).length },
    { label: 'Today', value: 'today' },
  ]

  const handleView = (lead: Lead) => {
    router.push(`/leads/${lead.id}`)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      paginatedLeads.forEach((l) => {
        if (!selectedLeadIds.has(l.id)) toggleLeadSelection(l.id)
      })
    } else {
      clearLeadSelection()
    }
  }

  return (
    <AppShell>
      <AppHeader title="Leads" subtitle="Manage and track all property leads" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex flex-col h-full bg-cream-canvas" style={{ paddingTop: '56px' }}>
        {/* Page Header with Tabs */}
        <div className="bg-cream-canvas border-b border-stone-surface sticky top-14 z-10">
          <PageHeader
            title="Leads"
            description={`${filteredLeads.length} leads total`}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tab) => { setActiveTab(tab); setPage(1) }}
          />

          {/* Search & Filters */}
          <SearchToolbar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1) }}
            filters={filters}
            onFiltersChange={(f) => { setFilters(f); setPage(1) }}
            onReset={() => { setFilters({}); setSearch(''); setPage(1) }}
            resultCount={filteredLeads.length}
            selectedCount={selectedLeadIds.size}
            onBulkDelete={() => clearLeadSelection()}
            onBulkAssign={() => {}}
            onExport={() => {}}
            onRefresh={() => {}}
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-cream-canvas">
          <LeadsTable
            leads={paginatedLeads}
            selectedIds={selectedLeadIds}
            onSelectChange={toggleLeadSelection}
            onSelectAll={handleSelectAll}
            onView={handleView}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </div>

        {/* Pagination */}
        <div className="bg-cream-canvas border-t border-stone-surface sticky bottom-0">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredLeads.length}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1) }}
          />
        </div>
      </main>
    </AppShell>
  )
}
