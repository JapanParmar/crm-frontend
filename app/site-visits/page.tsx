'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { siteVisitsApi } from '@/lib/api'
import type { ApiSiteVisit } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Building2, CalendarPlus, MapPin, Clock,
  CheckCircle2, XCircle, AlertCircle, Search,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

type Tab = 'all' | 'scheduled' | 'completed' | 'no_show' | 'cancelled'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  scheduled: { label: 'Scheduled', icon: <Clock className="w-3 h-3" />, bg: 'rgba(0, 134, 252, 0.08)', text: 'var(--color-sky-blue)' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="w-3 h-3" />, bg: 'rgba(0, 202, 72, 0.08)', text: 'var(--color-grass-green)' },
  no_show: { label: 'No Show', icon: <AlertCircle className="w-3 h-3" />, bg: 'rgba(224, 36, 36, 0.08)', text: 'var(--color-alert-red)' },
  cancelled: { label: 'Cancelled', icon: <XCircle className="w-3 h-3" />, bg: 'var(--color-stone-surface)', text: 'var(--color-muted-gray)' },
}

export default function SiteVisitsPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const queryParams = {
    status: activeTab !== 'all' ? activeTab : undefined,
    search: search || undefined,
    page,
    limit: 25,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['site-visits', queryParams],
    queryFn: () => siteVisitsApi.list(queryParams).then((r) => r.data),
  })

  const { data: countsData } = useQuery({
    queryKey: ['site-visit-counts'],
    queryFn: () => siteVisitsApi.counts().then((r) => r.data.data),
  })

  const visits = data?.data ?? []
  const meta = data?.meta
  const counts = countsData

  const tabs = [
    { label: 'All', value: 'all', count: counts?.all },
    { label: 'Scheduled', value: 'scheduled', count: counts?.scheduled },
    { label: 'Completed', value: 'completed', count: counts?.completed },
    { label: 'No Show', value: 'no_show', count: counts?.no_show },
    { label: 'Cancelled', value: 'cancelled', count: counts?.cancelled },
  ]

  return (
    <AppShell>
      <AppHeader title="Site Visits" subtitle="Track and manage property site visits" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex flex-col h-full bg-cream-canvas" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10">
          <PageHeader
            title="Site Visits"
            description={meta ? `${meta.total} total site visits` : 'Loading…'}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(t) => { setActiveTab(t as Tab); setPage(1) }}
            actions={<Button variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />}>Schedule Visit</Button>}
          />
          <div className="px-4 py-2.5">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-gray" />
              <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search visits…"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-stone-border bg-white text-xs focus:outline-none focus:border-ink-black"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 bg-cream-canvas">
          <div className="space-y-3 max-w-3xl">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 bg-white border border-stone-surface rounded-cards animate-pulse" />
              ))
            ) : visits.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-cards border border-stone-surface">
                <Building2 className="w-8 h-8 text-muted-gray mx-auto mb-2" />
                <p className="text-xs text-muted-gray">No site visits in this category</p>
              </div>
            ) : (
              visits.map((visit: ApiSiteVisit) => {
                const statusConf = STATUS_CONFIG[visit.status] ?? STATUS_CONFIG.scheduled
                return (
                  <div key={visit.id} className="p-4 rounded-cards border border-stone-surface bg-white hover:border-stone-border transition-all duration-100">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-stone-border/20" style={{ backgroundColor: statusConf.bg, color: statusConf.text }}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {visit.lead ? (
                            <Link href={`/leads/${visit.lead_id}`} className="text-sm font-semibold text-heading-charcoal hover:underline">{visit.lead.name}</Link>
                          ) : (
                            <span className="text-sm font-semibold text-heading-charcoal">Lead #{visit.lead_id}</span>
                          )}
                          {visit.lead?.phone && <span className="text-xs text-muted-gray">{visit.lead.phone}</span>}
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border" style={{ backgroundColor: statusConf.bg, color: statusConf.text, borderColor: statusConf.text + '20' }}>
                            {statusConf.icon} {statusConf.label}
                          </span>
                          {visit.status === 'completed' && visit.interested !== null && (
                            <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border', visit.interested ? 'bg-mint text-grass-green border-grass-green/20' : 'bg-alert-red/5 text-alert-red border-alert-red/20')}>
                              {visit.interested ? '✓ Interested' : '✗ Not interested'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-body-brown"><Building2 className="w-3 h-3 text-muted-gray" /><span className="font-semibold">{visit.project_name}</span></span>
                          {visit.location && <span className="flex items-center gap-1 text-xs text-muted-gray"><MapPin className="w-3 h-3" />{visit.location}</span>}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1.5 text-xs text-body-brown"><Clock className="w-3 h-3" />{formatDate(visit.scheduled_at, 'long')}</span>
                          {visit.attended_by && <span className="flex items-center gap-1.5 text-xs text-body-brown"><Avatar name={visit.attended_by.name} size="xs" />{visit.attended_by.name}</span>}
                        </div>
                        {visit.feedback && (
                          <div className="mt-2 p-2 rounded-cards bg-[#fcfbf9] border border-stone-border">
                            <p className="text-xs text-body-brown leading-relaxed">{visit.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-stone-border text-body-brown hover:text-ink-black disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="text-xs text-body-brown">Page {meta.page} of {meta.total_pages}</span>
              <button onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))} disabled={page === meta.total_pages} className="p-1.5 rounded border border-stone-border text-body-brown hover:text-ink-black disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  )
}
