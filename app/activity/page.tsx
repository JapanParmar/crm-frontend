'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { activityApi } from '@/lib/api'
import type { ApiActivity } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import {
  ScrollText, Star, Activity, CalendarPlus, CheckCircle2,
  AlertCircle, Building2, PhoneCall, Mail, MessageSquare, Tag,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  lead_created: Star,
  status_changed: Activity,
  follow_up_scheduled: CalendarPlus,
  follow_up_completed: CheckCircle2,
  follow_up_missed: AlertCircle,
  site_visit_scheduled: Building2,
  site_visit_completed: CheckCircle2,
  assigned: Star,
  call_made: PhoneCall,
  email_sent: Mail,
  whatsapp_sent: MessageSquare,
  note_added: Tag,
}

const ACTIVITY_COLORS: Record<string, { color: string; bg: string }> = {
  lead_created: { color: 'var(--color-slate)', bg: '#fffbe6' },
  status_changed: { color: 'var(--color-hero-violet)', bg: 'var(--color-lavender-wash)' },
  follow_up_scheduled: { color: '#437c00', bg: '#eefadc' },
  follow_up_completed: { color: '#437c00', bg: '#eefadc' },
  follow_up_missed: { color: 'var(--color-alert-red)', bg: 'rgba(224,36,36,0.06)' },
  site_visit_scheduled: { color: 'var(--color-sky-blue)', bg: 'rgba(0,134,252,0.06)' },
  site_visit_completed: { color: '#437c00', bg: '#eefadc' },
}

export default function ActivityLogPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['activities', page],
    queryFn: () => activityApi.list({ page, limit: 30 }).then((r) => r.data),
  })

  const activities = data?.data ?? []
  const meta = data?.meta

  return (
    <AppShell>
      <AppHeader title="Activity" subtitle="Work space audit trail" />

      <main className="flex flex-col h-full bg-cream-canvas" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10">
          <PageHeader
            title="Activity Feed"
            description="Real-time workspace activity audit log"
          />
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="bg-white rounded-cards border border-stone-surface p-6 max-w-3xl mx-auto">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-stone-surface" />
                    <div className="flex-1 space-y-1.5 py-1">
                      <div className="h-3.5 bg-stone-surface rounded w-3/4" />
                      <div className="h-2.5 bg-stone-surface rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-16">
                <ScrollText className="w-8 h-8 text-muted-gray mx-auto mb-2" />
                <p className="text-xs text-muted-gray">No activity log records found</p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-surface">
                {activities.map((activity: ApiActivity) => {
                  const Icon = ACTIVITY_ICONS[activity.type] ?? Activity
                  const colors = ACTIVITY_COLORS[activity.type] ?? { color: 'var(--color-body-brown)', bg: 'var(--color-stone-surface)' }
                  return (
                    <div key={activity.id} className="flex gap-4 relative z-10">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border border-stone-border"
                        style={{ backgroundColor: colors.bg, color: colors.color }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-heading-charcoal font-semibold leading-relaxed">
                          {activity.description}
                          {activity.lead_id && (
                            <Link
                              href={`/leads/${activity.lead_id}`}
                              className="text-ember hover:underline ml-1 font-bold"
                            >
                              (View Lead)
                            </Link>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-gray font-medium">
                            {activity.performed_by?.name ?? 'System'}
                          </span>
                          <span className="text-[10px] text-muted-gray">·</span>
                          <span className="text-[10px] text-muted-gray">
                            {formatDate(activity.created_at, 'long')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-stone-border text-body-brown hover:text-ink-black disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-body-brown">Page {meta.page} of {meta.total_pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                disabled={page === meta.total_pages}
                className="p-1.5 rounded border border-stone-border text-body-brown hover:text-ink-black disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  )
}
