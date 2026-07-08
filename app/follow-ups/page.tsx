'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { ScheduleFollowUpModal } from '@/components/leads/ScheduleFollowUpModal'
import { CompleteFollowUpModal } from '@/components/leads/CompleteFollowUpModal'
import { useAppStore } from '@/store/useAppStore'
import { followUpsApi } from '@/lib/api'
import type { ApiFollowUp } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  CalendarPlus, Clock, CheckCircle2, XCircle, AlertCircle,
  Search, Phone, MessageSquare, ChevronLeft, ChevronRight,
  PhoneCall, Mail, Building2, CalendarCheck,
} from 'lucide-react'
import Link from 'next/link'

type Tab = 'all' | 'today' | 'upcoming' | 'overdue' | 'missed' | 'completed'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  scheduled: { label: 'Scheduled', icon: <Clock className="w-3 h-3" />, bg: 'rgba(0, 134, 252, 0.08)', text: 'var(--color-sky-blue)' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="w-3 h-3" />, bg: 'rgba(0, 202, 72, 0.08)', text: 'var(--color-grass-green)' },
  missed: { label: 'Missed', icon: <AlertCircle className="w-3 h-3" />, bg: 'rgba(224, 36, 36, 0.08)', text: 'var(--color-alert-red)' },
  cancelled: { label: 'Cancelled', icon: <XCircle className="w-3 h-3" />, bg: 'var(--color-stone-surface)', text: 'var(--color-muted-gray)' },
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  call: <PhoneCall className="w-3 h-3" />,
  whatsapp: <MessageSquare className="w-3 h-3" />,
  email: <Mail className="w-3 h-3" />,
  site_visit: <Building2 className="w-3 h-3" />,
  meeting: <CalendarCheck className="w-3 h-3" />,
}

export default function FollowUpsPage() {
  const queryClient = useQueryClient()
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Scheduling states
  const [scheduleFuOpen, setScheduleFuOpen] = useState(false)
  const [completeFuOpen, setCompleteFuOpen] = useState(false)
  const [selectedFu, setSelectedFu] = useState<ApiFollowUp | null>(null)

  const missFuMutation = useMutation({
    mutationFn: (fuId: number) => followUpsApi.miss(fuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
      queryClient.invalidateQueries({ queryKey: ['follow-up-counts'] })
    },
  })

  const queryParams = {
    tab: activeTab,
    search: search || undefined,
    page,
    limit: 25,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['follow-ups', queryParams],
    queryFn: () => followUpsApi.list(queryParams).then((r) => r.data),
  })

  const { data: countsData } = useQuery({
    queryKey: ['follow-up-counts'],
    queryFn: () => followUpsApi.counts().then((r) => r.data.data),
  })

  const followUps = data?.data ?? []
  const meta = data?.meta
  const counts = countsData

  const tabs = [
    { label: 'Today', value: 'today', count: counts?.today },
    { label: 'Upcoming', value: 'upcoming', count: counts?.upcoming },
    { label: 'Overdue', value: 'overdue', count: counts?.overdue },
    { label: 'Missed', value: 'missed', count: counts?.missed },
    { label: 'Completed', value: 'completed', count: counts?.completed },
    { label: 'All', value: 'all', count: counts?.all },
  ]

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab)
    setPage(1)
  }

  return (
    <AppShell>
      <AppHeader title="Follow-ups" subtitle="Manage scheduled follow-ups" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex flex-col h-full bg-cream-canvas" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10">
          <PageHeader
            title="Follow-ups"
            description={meta ? `${meta.total} total follow-ups` : 'Loading…'}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            actions={
              <Button variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />} onClick={() => setScheduleFuOpen(true)}>
                Schedule
              </Button>
            }
          />
          <div className="px-4 py-2.5">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-gray" />
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by lead name or phone…"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-stone-border bg-white text-xs focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 md:p-5 bg-cream-canvas">
          <div className="space-y-3 max-w-3xl mx-auto">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 bg-white border border-stone-surface rounded-cards animate-pulse" />
              ))
            ) : followUps.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-cards border border-stone-surface">
                <CalendarCheck className="w-8 h-8 text-muted-gray mx-auto mb-2" />
                <p className="text-xs text-muted-gray">No follow-ups in this category</p>
              </div>
            ) : (
              followUps.map((fu: ApiFollowUp) => {
                const statusConf = STATUS_CONFIG[fu.status] ?? STATUS_CONFIG.scheduled
                const typeIcon = TYPE_ICONS[fu.type] ?? <CalendarCheck className="w-3 h-3" />
                return (
                  <div key={fu.id} className="p-4 rounded-cards border border-stone-surface bg-white hover:border-stone-border transition-all duration-100">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-stone-border/20"
                        style={{ backgroundColor: statusConf.bg, color: statusConf.text }}
                      >
                        {typeIcon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {fu.lead ? (
                            <Link href={`/leads/${fu.lead_id}`} className="text-sm font-semibold text-heading-charcoal hover:underline">
                              {fu.lead.name}
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold text-heading-charcoal">Lead #{fu.lead_id}</span>
                          )}
                          {fu.lead?.phone && <span className="text-xs text-muted-gray">{fu.lead.phone}</span>}
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
                            style={{ backgroundColor: statusConf.bg, color: statusConf.text, borderColor: statusConf.text + '20' }}
                          >
                            {statusConf.icon}
                            {statusConf.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-surface text-body-brown border border-stone-border capitalize">
                            {fu.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs text-body-brown">
                            <Clock className="w-3 h-3" />
                            {formatDate(fu.scheduled_at, 'long')}
                          </div>
                          {fu.assigned_to && (
                            <div className="flex items-center gap-1.5 text-xs text-body-brown">
                              <Avatar name={fu.assigned_to.name} size="xs" />
                              {fu.assigned_to.name}
                            </div>
                          )}
                        </div>

                        {fu.notes && (
                          <p className="text-xs text-muted-gray mt-1.5 truncate">{fu.notes}</p>
                        )}
                        {fu.outcome && (
                          <p className="text-xs text-grass-green mt-1 font-semibold">Outcome: {fu.outcome}</p>
                        )}

                        {/* Actions for scheduled — below content on mobile */}
                        {fu.status === 'scheduled' && (
                          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-stone-surface/60 sm:hidden">
                            {fu.lead?.phone && (
                              <>
                                <a href={`tel:${fu.lead.phone}`} className="p-2 rounded-lg bg-stone-surface text-body-brown touch-manipulation" title="Call">
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a href={`https://wa.me/91${fu.lead.phone}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-stone-surface text-body-brown touch-manipulation" title="WhatsApp">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </>
                            )}
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => {
                                setSelectedFu(fu)
                                setCompleteFuOpen(true)
                              }}
                            >
                              Complete
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-alert-red hover:bg-alert-red/5"
                              onClick={() => {
                                if (confirm('Are you sure you want to mark this follow-up as missed?')) {
                                  missFuMutation.mutate(fu.id)
                                }
                              }}
                              disabled={missFuMutation.isPending}
                            >
                              Missed
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Actions for scheduled — right side on desktop */}
                      {fu.status === 'scheduled' && (
                        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                          {fu.lead?.phone && (
                            <>
                              <a href={`tel:${fu.lead.phone}`} className="p-1.5 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black transition-colors" title="Call">
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a href={`https://wa.me/91${fu.lead.phone}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black transition-colors" title="WhatsApp">
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => {
                              setSelectedFu(fu)
                              setCompleteFuOpen(true)
                            }}
                          >
                            Complete
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-alert-red hover:bg-alert-red/5"
                            onClick={() => {
                              if (confirm('Are you sure you want to mark this follow-up as missed?')) {
                                missFuMutation.mutate(fu.id)
                              }
                            }}
                            disabled={missFuMutation.isPending}
                          >
                            Missed
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-stone-border text-body-brown hover:text-ink-black disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-body-brown">Page {meta.page} of {meta.total_pages}</span>
              <button onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))} disabled={page === meta.total_pages} className="p-1.5 rounded border border-stone-border text-body-brown hover:text-ink-black disabled:opacity-40 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Schedule / Complete Modals */}
      <ScheduleFollowUpModal
        open={scheduleFuOpen}
        onClose={() => setScheduleFuOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
          queryClient.invalidateQueries({ queryKey: ['follow-up-counts'] })
        }}
      />

      <CompleteFollowUpModal
        open={completeFuOpen}
        followUp={selectedFu}
        onClose={() => {
          setCompleteFuOpen(false)
          setSelectedFu(null)
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
          queryClient.invalidateQueries({ queryKey: ['follow-up-counts'] })
        }}
      />
    </AppShell>
  )
}
