'use client'

import React, { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  PhoneCall,
  MessageSquare,
  Mail,
  CalendarPlus,
  Building2,
  Phone,
  MapPin,
  Tag,
  Clock,
  CheckCircle2,
  Activity,
  Star,
  AlertCircle,
  Home,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { LeadStatusBadge, LeadSourceBadge, LeadPriorityBadge, LeadScore } from '@/components/leads/LeadBadges'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { leadsApi, usersApi, followUpsApi } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import type { ApiActivity, ApiFollowUp, ApiSiteVisit } from '@/lib/api'
import { LEAD_STATUS_LABELS, FOLLOW_UP_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatCurrency, formatPhone } from '@/lib/utils'
import { cn } from '@/lib/utils'

// New modals
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { ScheduleFollowUpModal } from '@/components/leads/ScheduleFollowUpModal'
import { CompleteFollowUpModal } from '@/components/leads/CompleteFollowUpModal'
import { ScheduleSiteVisitModal } from '@/components/leads/ScheduleSiteVisitModal'
import { CompleteSiteVisitModal } from '@/components/leads/CompleteSiteVisitModal'
import { ConfirmDialog } from '@/components/ui/modal'

const PIPELINE_STAGES = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'qualified', label: 'Qualified' },
  { status: 'site_visit', label: 'Site Visit' },
  { status: 'negotiation', label: 'Negotiation' },
  { status: 'closed_won', label: 'Won' },
]

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

type TabKey = 'overview' | 'timeline' | 'followups' | 'sitevisits'

interface LeadDetailPageProps {
  params: Promise<{ id: string }>
}

export default function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = use(params)
  const queryClient = useQueryClient()
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  // Modals state
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [scheduleFuOpen, setScheduleFuOpen] = useState(false)
  const [completeFuOpen, setCompleteFuOpen] = useState(false)
  const [selectedFu, setSelectedFu] = useState<ApiFollowUp | null>(null)

  const [scheduleSvOpen, setScheduleSvOpen] = useState(false)
  const [completeSvOpen, setCompleteSvOpen] = useState(false)
  const [selectedSv, setSelectedSv] = useState<ApiSiteVisit | null>(null)

  const { data: leadData, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(id).then((r) => r.data.data),
  })

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.employees().then((r) => r.data.data),
    enabled: !!user?.access?.assign_leads,
  })

  const assignMutation = useMutation({
    mutationFn: (employeeId: number | null) =>
      leadsApi.update(id, { assigned_to: (employeeId ?? null) as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads-counts'] })
      queryClient.invalidateQueries({ queryKey: ['lead-activity', id] })
    },
  })

  const { data: followUpsData } = useQuery({
    queryKey: ['lead-followups', id],
    queryFn: () => leadsApi.followUps(id).then((r) => r.data.data),
    enabled: activeTab === 'followups' || activeTab === 'overview',
  })

  const { data: siteVisitsData } = useQuery({
    queryKey: ['lead-sitevisits', id],
    queryFn: () => leadsApi.siteVisits(id).then((r) => r.data.data),
    enabled: activeTab === 'sitevisits' || activeTab === 'overview',
  })

  const { data: activityData } = useQuery({
    queryKey: ['lead-activity', id],
    queryFn: () => leadsApi.activity(id).then((r) => r.data.data),
    enabled: activeTab === 'timeline',
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => leadsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads-counts'] })
      queryClient.invalidateQueries({ queryKey: ['lead-activity', id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads-counts'] })
      router.replace('/leads')
    },
  })

  const missFuMutation = useMutation({
    mutationFn: (fuId: number) => followUpsApi.miss(fuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      queryClient.invalidateQueries({ queryKey: ['lead-followups', id] })
      queryClient.invalidateQueries({ queryKey: ['lead-activity', id] })
    },
  })

  const lead = leadData
  const followUps = followUpsData ?? []
  const siteVisits = siteVisitsData ?? []
  const activities = activityData ?? []

  const tabs = [
    { key: 'overview' as TabKey, label: 'Overview' },
    { key: 'timeline' as TabKey, label: 'Timeline', count: undefined },
    { key: 'followups' as TabKey, label: 'Follow-ups', count: lead?.follow_up_count },
    { key: 'sitevisits' as TabKey, label: 'Site Visits', count: lead?.site_visit_count },
  ]

  const stageIndex = PIPELINE_STAGES.findIndex((s) => s.status === lead?.status)

  if (isLoading) {
    return (
      <AppShell>
        <AppHeader title="Loading…" backHref="/leads" breadcrumbs={[{ label: 'Leads', href: '/leads' }, { label: 'Loading…' }]} />
        <main className="flex-1 overflow-auto bg-cream-canvas" style={{ paddingTop: '56px' }}>
          <div className="max-w-5xl mx-auto p-8 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-white border border-stone-surface rounded-cards animate-pulse" />
            ))}
          </div>
        </main>
      </AppShell>
    )
  }

  if (!lead) {
    return (
      <AppShell>
        <AppHeader title="Not Found" backHref="/leads" breadcrumbs={[{ label: 'Leads', href: '/leads' }, { label: 'Not Found' }]} />
        <main className="flex-1 flex items-center justify-center" style={{ paddingTop: '56px' }}>
          <p className="text-muted-gray">Lead not found.</p>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AppHeader
        title={lead.name}
        backHref="/leads"
        breadcrumbs={[{ label: 'Leads', href: '/leads' }, { label: lead.name }]}
      />

      <main className="flex-1 overflow-auto bg-cream-canvas" style={{ paddingTop: '56px' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">

          {/* Lead Header Card */}
          <div className="bg-white rounded-cards border border-stone-surface p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Avatar name={lead.name} size="lg" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-bold text-heading-charcoal">{lead.name}</h1>
                    <LeadStatusBadge status={lead.status as never} />
                    <LeadPriorityBadge priority={lead.priority as never} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-gray font-mono">{lead.lead_number}</span>
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-body-brown hover:text-ink-black">
                      <Phone className="w-3 h-3" /> {formatPhone(lead.phone)}
                    </a>
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-body-brown hover:text-ink-black">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-buttons text-xs font-semibold border border-stone-border hover:bg-stone-surface transition-colors text-body-brown">
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </a>
                <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-buttons text-xs font-semibold border border-stone-border hover:bg-stone-surface transition-colors text-body-brown">
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Pencil className="w-3.5 h-3.5" />}
                  onClick={() => setEditOpen(true)}
                  className="text-body-brown hover:text-ink-black"
                >
                  Edit
                </Button>
                {user?.permissions?.includes('delete-leads') && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5 text-alert-red" />}
                    onClick={() => setDeleteOpen(true)}
                    className="text-alert-red border-alert-red/20 hover:bg-alert-red/5"
                  >
                    Delete
                  </Button>
                )}
                <LeadScore score={lead.score} />
              </div>
            </div>
          </div>

          {/* Pipeline Stage */}
          <div className="bg-white rounded-cards border border-stone-surface p-4">
            <p className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-3">Pipeline Stage</p>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isDone = idx < stageIndex
                const isActive = idx === stageIndex
                return (
                  <React.Fragment key={stage.status}>
                    <button
                      onClick={() => updateStatusMutation.mutate(stage.status)}
                      disabled={updateStatusMutation.isPending}
                      className={cn(
                        'flex-1 min-w-[72px] py-2 px-2 rounded-buttons text-[10px] font-semibold border text-center transition-all duration-100',
                        isActive
                          ? 'bg-ink-black text-white border-ink-black'
                          : isDone
                          ? 'bg-grass-green/10 text-grass-green border-grass-green/30'
                          : 'bg-stone-surface text-muted-gray border-stone-border hover:border-stone-border hover:text-body-brown'
                      )}
                    >
                      {stage.label}
                    </button>
                    {idx < PIPELINE_STAGES.length - 1 && (
                      <div className={cn('w-4 h-px flex-shrink-0', isDone ? 'bg-grass-green' : 'bg-stone-border')} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-stone-surface">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all',
                  activeTab === tab.key
                    ? 'border-ink-black text-ink-black'
                    : 'border-transparent text-body-brown hover:text-heading-charcoal'
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn('px-1.5 rounded-full text-[10px] font-bold', activeTab === tab.key ? 'bg-ink-black text-white' : 'bg-stone-surface text-muted-gray')}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Lead Info */}
              <div className="bg-white rounded-cards border border-stone-surface p-5 space-y-3">
                <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider">Lead Information</h3>
                {[
                  { label: 'Source', value: <LeadSourceBadge source={lead.source as never} /> },
                  { label: 'Property Type', value: lead.property_type ?? '—' },
                  { label: 'BHK Preference', value: lead.bhk_preference ?? '—' },
                  { label: 'Budget Range', value: lead.budget_min && lead.budget_max ? `${formatCurrency(lead.budget_min)} – ${formatCurrency(lead.budget_max)}` : '—' },
                  { label: 'Location', value: lead.preferred_location ?? '—', icon: <MapPin className="w-3 h-3" /> },
                  { label: 'Project Interest', value: lead.project_interest ?? '—', icon: <Building2 className="w-3 h-3" /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-start justify-between gap-2">
                    <span className="text-xs text-muted-gray font-medium min-w-[110px]">{label}</span>
                    <span className="text-xs text-heading-charcoal font-semibold text-right flex items-center gap-1">
                      {icon}{typeof value === 'string' ? value : value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Assignment + Activity */}
              <div className="space-y-4">
                <div className="bg-white rounded-cards border border-stone-surface p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider">Assignment</h3>
                  {user?.access?.assign_leads ? (
                    <div className="space-y-1.5">
                      <select
                        value={lead.assigned_to?.id || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          assignMutation.mutate(val ? parseInt(val) : null)
                        }}
                        disabled={assignMutation.isPending}
                        className="w-full h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {(employeesData ?? []).map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                      {lead.assigned_at && (
                        <p className="text-[10px] text-muted-gray">Assigned {formatDate(lead.assigned_at, 'relative')}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      {lead.assigned_to ? (
                        <div className="flex items-center gap-2.5">
                          <Avatar name={lead.assigned_to.name} size="sm" />
                          <div>
                            <p className="text-xs font-bold text-heading-charcoal">{lead.assigned_to.name}</p>
                            <p className="text-[10px] text-muted-gray">{lead.assigned_to.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-gray italic">Unassigned</p>
                      )}
                      {lead.assigned_at && (
                        <p className="text-[10px] text-muted-gray">Assigned {formatDate(lead.assigned_at, 'relative')}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-white rounded-cards border border-stone-surface p-5 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-3">Activity Summary</h3>
                  {[
                    { label: 'Follow-ups', value: lead.follow_up_count, icon: <Clock className="w-3 h-3" /> },
                    { label: 'Site Visits', value: lead.site_visit_count, icon: <Building2 className="w-3 h-3" /> },
                    { label: 'Last Contacted', value: lead.last_contacted_at ? formatDate(lead.last_contacted_at, 'relative') : 'Never', icon: <PhoneCall className="w-3 h-3" /> },
                    { label: 'Next Follow-up', value: lead.next_follow_up_at ? formatDate(lead.next_follow_up_at, 'short') : '—', icon: <CalendarPlus className="w-3 h-3" /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-body-brown">{icon}{label}</span>
                      <span className="font-semibold text-heading-charcoal">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="md:col-span-2 bg-white rounded-cards border border-stone-surface p-5">
                  <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-xs text-body-brown leading-relaxed">{lead.notes}</p>
                </div>
              )}

              {/* Tags */}
              {lead.tags && lead.tags.length > 0 && (
                <div className="md:col-span-2 bg-white rounded-cards border border-stone-surface p-5">
                  <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-surface text-body-brown border border-stone-border">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="bg-white rounded-cards border border-stone-surface p-5">
              <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-4">Activity Timeline</h3>
              {activities.length === 0 ? (
                <p className="text-xs text-muted-gray text-center py-8">No activity recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity: ApiActivity) => {
                    const Icon = ACTIVITY_ICONS[activity.type] ?? Activity
                    const colors = ACTIVITY_COLORS[activity.type] ?? { color: 'var(--color-body-brown)', bg: 'var(--color-stone-surface)' }
                    return (
                      <div key={activity.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border border-stone-border" style={{ backgroundColor: colors.bg, color: colors.color }}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-heading-charcoal font-semibold">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-gray">{activity.performed_by?.name ?? 'System'}</span>
                            <span className="text-[10px] text-muted-gray">·</span>
                            <span className="text-[10px] text-muted-gray">{formatDate(activity.created_at, 'relative')}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'followups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider">Scheduled Follow-ups</h3>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setScheduleFuOpen(true)}
                >
                  Schedule Follow-up
                </Button>
              </div>

              {followUps.length === 0 ? (
                <div className="bg-white rounded-cards border border-stone-surface p-8 text-center">
                  <CalendarPlus className="w-8 h-8 text-muted-gray mx-auto mb-2" />
                  <p className="text-xs text-muted-gray mb-4">No follow-ups scheduled yet</p>
                  <Button variant="outline" size="sm" onClick={() => setScheduleFuOpen(true)}>
                    Schedule One Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {followUps.map((fu: ApiFollowUp) => (
                    <div key={fu.id} className="bg-white rounded-cards border border-stone-surface p-4 flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-heading-charcoal capitalize">{fu.type}</span>
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                            fu.status === 'completed' ? 'bg-grass-green/10 text-grass-green' :
                            fu.status === 'missed' ? 'bg-alert-red/10 text-alert-red' :
                            fu.status === 'scheduled' ? 'bg-sky-blue/10 text-sky-blue' :
                            'bg-stone-surface text-muted-gray'
                          )}>
                            {fu.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-gray font-medium">{formatDate(fu.scheduled_at, 'long')}</p>
                        {fu.notes && <p className="text-xs text-body-brown mt-1.5 leading-relaxed bg-[#fcfbf9] border border-stone-surface/60 p-2 rounded">{fu.notes}</p>}
                        {fu.outcome && <p className="text-xs text-grass-green mt-1.5 font-semibold">Outcome: {fu.outcome}</p>}
                        {fu.assigned_to && <p className="text-[10px] text-muted-gray mt-1">Handled by {fu.assigned_to.name}</p>}
                      </div>
                      
                      {fu.status === 'scheduled' && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
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
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sitevisits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wider">Scheduled Site Visits</h3>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setScheduleSvOpen(true)}
                >
                  Schedule Site Visit
                </Button>
              </div>

              {siteVisits.length === 0 ? (
                <div className="bg-white rounded-cards border border-stone-surface p-8 text-center">
                  <Building2 className="w-8 h-8 text-muted-gray mx-auto mb-2" />
                  <p className="text-xs text-muted-gray mb-4">No site visits scheduled yet</p>
                  <Button variant="outline" size="sm" onClick={() => setScheduleSvOpen(true)}>
                    Schedule One Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {siteVisits.map((visit: ApiSiteVisit) => (
                    <div key={visit.id} className="bg-white rounded-cards border border-stone-surface p-4 flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-heading-charcoal">{visit.project_name}</span>
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                            visit.status === 'completed' ? 'bg-grass-green/10 text-grass-green' :
                            visit.status === 'no_show' ? 'bg-alert-red/10 text-alert-red' :
                            'bg-sky-blue/10 text-sky-blue'
                          )}>
                            {visit.status.replace('_', ' ')}
                          </span>
                          {visit.interested !== null && (
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold', visit.interested ? 'bg-grass-green/10 text-grass-green' : 'bg-alert-red/10 text-alert-red')}>
                              {visit.interested ? '✓ Interested' : '✗ Not Interested'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-gray font-medium">{formatDate(visit.scheduled_at, 'long')}</p>
                        {visit.location && (
                          <p className="text-xs text-body-brown flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-muted-gray" />{visit.location}
                          </p>
                        )}
                        {visit.notes && <p className="text-xs text-body-brown mt-1.5 leading-relaxed bg-[#fcfbf9] border border-stone-surface/60 p-2 rounded">{visit.notes}</p>}
                        {visit.feedback && <p className="text-xs text-body-brown mt-1.5 p-2 bg-[#fcfbf9] border border-stone-surface rounded leading-relaxed">{visit.feedback}</p>}
                        {visit.attended_by && <p className="text-[10px] text-muted-gray mt-1">Attended by {visit.attended_by.name}</p>}
                      </div>

                      {visit.status === 'scheduled' && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => {
                              setSelectedSv(visit)
                              setCompleteSvOpen(true)
                            }}
                          >
                            Log Feedback
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals & Dialogs */}
      <AddLeadModal
        open={editOpen}
        lead={lead}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['lead', id] })
          queryClient.invalidateQueries({ queryKey: ['leads'] })
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Lead"
        description={`Are you sure you want to permanently delete lead "${lead.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      />

      <ScheduleFollowUpModal
        open={scheduleFuOpen}
        leadId={lead.id}
        onClose={() => setScheduleFuOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['lead', id] })
          queryClient.invalidateQueries({ queryKey: ['lead-followups', id] })
          queryClient.invalidateQueries({ queryKey: ['lead-activity', id] })
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
          queryClient.invalidateQueries({ queryKey: ['lead', id] })
          queryClient.invalidateQueries({ queryKey: ['lead-followups', id] })
          queryClient.invalidateQueries({ queryKey: ['lead-activity', id] })
        }}
      />

      <ScheduleSiteVisitModal
        open={scheduleSvOpen}
        leadId={lead.id}
        onClose={() => setScheduleSvOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['lead', id] })
          queryClient.invalidateQueries({ queryKey: ['lead-sitevisits', id] })
          queryClient.invalidateQueries({ queryKey: ['lead-activity', id] })
        }}
      />

      <CompleteSiteVisitModal
        open={completeSvOpen}
        siteVisit={selectedSv}
        onClose={() => {
          setCompleteSvOpen(false)
          setSelectedSv(null)
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['lead', id] })
          queryClient.invalidateQueries({ queryKey: ['lead-sitevisits', id] })
          queryClient.invalidateQueries({ queryKey: ['lead-activity', id] })
        }}
      />
    </AppShell>
  )
}
