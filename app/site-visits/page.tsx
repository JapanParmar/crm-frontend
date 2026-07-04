'use client'

import React, { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LeadStatusBadge } from '@/components/leads/LeadBadges'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Building2,
  CalendarPlus,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Car,
  Star,
} from 'lucide-react'

const now = Date.now()
const MOCK_VISITS = [
  { id: '1', leadName: 'Rahul Sharma', leadId: 'lead-1', phone: '9876543210', project: 'Prestige Skyline', location: 'Whitefield, Bangalore', status: 'scheduled', scheduledAt: new Date(now + 3600000).toISOString(), attendedBy: 'Arjun Rathore', feedback: null, interested: null },
  { id: '2', leadName: 'Priya Patel', leadId: 'lead-2', phone: '9123456789', project: 'Brigade Utopia', location: 'Yelahanka, Bangalore', status: 'completed', scheduledAt: new Date(now - 86400000).toISOString(), attendedBy: 'Sneha Kapoor', feedback: 'Very interested in 3BHK corner unit on 12th floor. Concerned about parking allocation.', interested: true },
  { id: '3', leadName: 'Amit Kumar', leadId: 'lead-3', phone: '9345678901', project: 'Sobha Dream', location: 'Sarjapur Road, Bangalore', status: 'no_show', scheduledAt: new Date(now - 2 * 86400000).toISOString(), attendedBy: 'Dev Malhotra', feedback: 'Lead did not show up. Called multiple times, no response.', interested: null },
  { id: '4', leadName: 'Sunita Verma', leadId: 'lead-4', phone: '9234567890', project: 'DLF Camellias', location: 'Hebbal, Bangalore', status: 'completed', scheduledAt: new Date(now - 3 * 86400000).toISOString(), attendedBy: 'Priti Saxena', feedback: 'Liked the amenities but found it too expensive. Suggested 2BHK options.', interested: false },
  { id: '5', leadName: 'Vikash Singh', leadId: 'lead-5', phone: '9456789012', project: 'Godrej Reserve', location: 'Devanahalli, Bangalore', status: 'scheduled', scheduledAt: new Date(now + 2 * 86400000).toISOString(), attendedBy: 'Arjun Rathore', feedback: null, interested: null },
  { id: '6', leadName: 'Anjali Gupta', leadId: 'lead-6', phone: '9876512345', project: 'Prestige Skyline', location: 'Whitefield, Bangalore', status: 'cancelled', scheduledAt: new Date(now - 86400000).toISOString(), attendedBy: 'Sneha Kapoor', feedback: 'Customer rescheduled due to personal reasons.', interested: null },
]

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', icon: <Clock className="w-3 h-3" />, bg: 'rgba(0, 134, 252, 0.08)', text: 'var(--color-sky-blue)' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="w-3 h-3" />, bg: 'rgba(0, 202, 72, 0.08)', text: 'var(--color-grass-green)' },
  no_show: { label: 'No Show', icon: <AlertCircle className="w-3 h-3" />, bg: 'rgba(224, 36, 36, 0.08)', text: 'var(--color-alert-red)' },
  cancelled: { label: 'Cancelled', icon: <XCircle className="w-3 h-3" />, bg: 'var(--color-stone-surface)', text: 'var(--color-muted-gray)' },
}

export default function SiteVisitsPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  const tabs = [
    { label: 'All', value: 'all', count: MOCK_VISITS.length },
    { label: 'Scheduled', value: 'scheduled', count: 2 },
    { label: 'Completed', value: 'completed', count: 2 },
    { label: 'No Show', value: 'no_show', count: 1 },
    { label: 'Cancelled', value: 'cancelled', count: 1 },
  ]

  const filtered = MOCK_VISITS.filter((v) => {
    if (activeTab !== 'all' && v.status !== activeTab) return false
    if (search) {
      const q = search.toLowerCase()
      return v.leadName.toLowerCase().includes(q) || v.project.toLowerCase().includes(q) || v.location.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <AppShell>
      <AppHeader title="Site Visits" subtitle="Track and manage property site visits" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex flex-col h-full bg-cream-canvas" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10">
          <PageHeader
            title="Site Visits"
            description={`${MOCK_VISITS.length} total site visits`}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actions={
              <Button variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />}>
                Schedule Visit
              </Button>
            }
          />
          <div className="px-4 py-2.5">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-gray" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search visits..."
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-stone-border bg-white text-xs focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 bg-cream-canvas">
          <div className="space-y-3 max-w-3xl">
            {filtered.map((visit) => {
              const statusConf = STATUS_CONFIG[visit.status as keyof typeof STATUS_CONFIG]
              const isCompleted = visit.status === 'completed'
              return (
                <div
                  key={visit.id}
                  className="p-4 rounded-cards border border-stone-surface bg-white hover:border-stone-border transition-all duration-100"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-stone-border/20"
                      style={{ backgroundColor: statusConf.bg, color: statusConf.text }}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-heading-charcoal">{visit.leadName}</span>
                        <span className="text-xs text-muted-gray">{visit.phone}</span>
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
                          style={{ backgroundColor: statusConf.bg, color: statusConf.text, borderColor: statusConf.text + '20' }}
                        >
                          {statusConf.icon}
                          {statusConf.label}
                        </span>
                        {isCompleted && visit.interested !== null && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border',
                              visit.interested ? 'bg-mint text-grass-green border-grass-green/20' : 'bg-alert-red/5 text-alert-red border-alert-red/20'
                            )}
                          >
                            {visit.interested ? '✓ Interested' : '✗ Not interested'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-body-brown">
                          <Building2 className="w-3 h-3 text-muted-gray" />
                          <span className="font-semibold">{visit.project}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-gray">
                          <MapPin className="w-3 h-3 text-muted-gray" />
                          {visit.location}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-body-brown">
                          <Clock className="w-3 h-3" />
                          {formatDate(visit.scheduledAt, 'long')}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-body-brown">
                          <Avatar name={visit.attendedBy} size="xs" />
                          {visit.attendedBy}
                        </div>
                      </div>

                      {visit.feedback && (
                        <div className="mt-2 p-2 rounded-cards bg-[#fcfbf9] border border-stone-border">
                          <p className="text-xs text-body-brown leading-relaxed">{visit.feedback}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!isCompleted && visit.status === 'scheduled' && (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <Button variant="primary" size="xs">
                          Mark Complete
                        </Button>
                        <Button variant="outline" size="xs">
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </AppShell>
  )
}
