'use client'

import React, { useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import {
  PhoneCall,
  MessageSquare,
  Mail,
  CalendarPlus,
  Building2,
  ChevronLeft,
  Phone,
  MapPin,
  DollarSign,
  Tag,
  Clock,
  CheckCircle2,
  MessageCircle,
  FileText,
  Activity,
  Pencil,
  UserPlus,
  MoreVertical,
  Star,
  AlertCircle,
  Home,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { LeadStatusBadge, LeadSourceBadge, PriorityBadge, LeadScore } from '@/components/leads/LeadBadges'

import { Avatar } from '@/components/ui/avatar'
import { Button, IconButton } from '@/components/ui/button'
import { generateMockLeads, LEAD_STATUS_LABELS, FOLLOW_UP_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatCurrency, formatPhone } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { LeadStatus } from '@/types'

const ALL_LEADS = generateMockLeads(120)

const PIPELINE_STAGES: { status: LeadStatus; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'qualified', label: 'Qualified' },
  { status: 'site_visit', label: 'Site Visit' },
  { status: 'negotiation', label: 'Negotiation' },
  { status: 'closed_won', label: 'Won' },
]

const MOCK_ACTIVITIES = [
  { id: '1', type: 'call_made', description: 'Call made — discussed 3BHK requirements in Whitefield', by: 'Arjun Rathore', time: '2 hours ago', icon: PhoneCall, color: '#437c00', bg: '#eefadc' },
  { id: '2', type: 'follow_up_scheduled', description: 'Follow-up scheduled for tomorrow at 10 AM', by: 'Arjun Rathore', time: '3 hours ago', icon: CalendarPlus, color: 'var(--color-hero-violet)', bg: 'var(--color-lavender-wash)' },
  { id: '3', type: 'status_changed', description: 'Status changed from New → Contacted', by: 'System', time: '3 hours ago', icon: Activity, color: 'var(--color-hero-violet)', bg: 'var(--color-lavender-wash)' },
  { id: '4', type: 'whatsapp_sent', description: 'WhatsApp sent — project brochure shared', by: 'Arjun Rathore', time: '1 day ago', icon: MessageSquare, color: '#437c00', bg: '#eefadc' },
  { id: '5', type: 'lead_created', description: 'Lead created from MagicBricks inquiry', by: 'System', time: '2 days ago', icon: Star, color: 'var(--color-slate)', bg: 'var(--color-highlight-gold)' },
]

const nowForFollowUps = 1785844800000
const MOCK_FOLLOW_UPS = [
  { id: '1', type: 'call', status: 'scheduled', scheduledAt: new Date(nowForFollowUps + 86400000).toISOString(), notes: 'Discuss pricing and payment plans' },
  { id: '2', type: 'whatsapp', status: 'completed', scheduledAt: new Date(nowForFollowUps - 86400000).toISOString(), notes: 'Sent project brochure and floor plans', outcome: 'Lead interested, wants site visit' },
  { id: '3', type: 'call', status: 'missed', scheduledAt: new Date(nowForFollowUps - 3 * 86400000).toISOString(), notes: 'Initial contact call' },
]

const MOCK_NOTES = [
  { id: '1', text: 'Customer is looking for a 3BHK in Whitefield. Budget is flexible up to 1.2Cr. Has elderly parents so needs elevator access. Currently renting.', by: 'Arjun Rathore', time: '1 day ago' },
  { id: '2', text: 'Shared 3 properties: Prestige Skyline, Brigade Utopia, and Sobha Dream. Customer preferred Prestige Skyline but wants to see more options.', by: 'Arjun Rathore', time: '3 days ago' },
]

type TabKey = 'overview' | 'timeline' | 'followups' | 'sitevisits' | 'notes' | 'documents'

interface LeadDetailPageProps {
  params: Promise<{ id: string }>
}

export default function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = use(params)
  const lead = ALL_LEADS.find((l) => l.id === id) || ALL_LEADS[0]

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(lead.status)

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'timeline', label: 'Timeline', count: 5 },
    { key: 'followups', label: 'Follow-ups', count: 3 },
    { key: 'sitevisits', label: 'Site Visits', count: lead.siteVisitCount },
    { key: 'notes', label: 'Notes', count: 2 },
    { key: 'documents', label: 'Documents' },
  ]

  const stageIndex = PIPELINE_STAGES.findIndex((s) => s.status === currentStatus)

  return (
    <AppShell>
      <AppHeader
        title={lead.name}
        backHref="/leads"
        breadcrumbs={[
          { label: 'Leads', href: '/leads' },
          { label: lead.leadNumber },
          { label: lead.name },
        ]}
      />

      <main className="flex flex-col bg-cream-canvas" style={{ paddingTop: '56px', minHeight: '100vh' }}>
        {/* Sticky Lead Header */}
        <div
          className="sticky z-10 bg-[#fcfbf9] border-b border-stone-surface"
          style={{ top: '56px' }}
        >
           {/* Lead Summary Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4">
            {/* Avatar + Name */}
            <div className="flex items-center gap-3">
              <Avatar name={lead.name} size="lg" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-base font-bold text-heading-charcoal">{lead.name}</h1>
                  <span className="text-xs font-mono text-muted-gray">{lead.leadNumber}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <LeadStatusBadge status={currentStatus} dot />
                  <LeadSourceBadge source={lead.source} />
                  <PriorityBadge priority={lead.priority} />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <a href={`tel:${lead.phone}`}>
                <Button variant="secondary" size="sm" icon={<PhoneCall className="w-3.5 h-3.5" />}>
                  Call
                </Button>
              </a>
              <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" icon={<MessageSquare className="w-3.5 h-3.5" />}>
                  WhatsApp
                </Button>
              </a>
              {lead.email && (
                <a href={`mailto:${lead.email}`}>
                  <Button variant="secondary" size="sm" icon={<Mail className="w-3.5 h-3.5" />}>
                    Email
                  </Button>
                </a>
              )}
              <Button variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />}>
                Schedule Follow-up
              </Button>
              <Button variant="outline" size="sm" icon={<Building2 className="w-3.5 h-3.5" />}>
                Site Visit
              </Button>
              <IconButton icon={<MoreVertical className="w-4 h-4" />} size="sm" tooltip="More actions" />
            </div>
          </div>

          {/* Pipeline Progress Bar */}
          <div className="px-5 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {PIPELINE_STAGES.map((stage, i) => {
                const isDone = i < stageIndex
                const isCurrent = i === stageIndex
                return (
                  <button
                    key={stage.status}
                    onClick={() => setCurrentStatus(stage.status)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-pills border transition-all duration-100 whitespace-nowrap',
                      isDone && 'text-[#00c978] bg-[#00c978]/10 border-[#00c978]/30',
                      isCurrent && 'text-ink-black bg-[#ffcd6c] border-[#ffcd6c] shadow-sm',
                      !isDone && !isCurrent && 'text-muted-gray bg-white border-stone-surface hover:bg-stone-surface hover:text-ink-black'
                    )}
                    title={`Move to ${stage.label}`}
                  >
                    <span>{i + 1}.</span>
                    {stage.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 px-5 py-2 border-t border-stone-surface bg-[#fcfbf9] overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-pills border transition-all duration-100',
                    isActive
                      ? 'bg-ink-black text-white border-ink-black'
                      : 'bg-transparent text-body-brown border-transparent hover:text-ink-black hover:bg-stone-surface'
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={cn(
                        'px-1.5 py-0.25 rounded-full text-[10px] font-bold border ml-0.5',
                        isActive ? 'bg-[#ffcd6c] text-[#121212] border-[#ffcd6c]' : 'bg-stone-surface text-body-brown border-stone-border'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Main Content */}
          <div className="flex-1 overflow-auto p-5">
            {activeTab === 'overview' && <OverviewTab lead={lead} />}
            {activeTab === 'timeline' && <TimelineTab />}
            {activeTab === 'followups' && <FollowUpsTab />}
            {activeTab === 'notes' && <NotesTab lead={lead} />}
            {(activeTab === 'sitevisits' || activeTab === 'documents') && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-gray">
                <Building2 className="w-8 h-8 mb-2" />
                <p className="text-sm">No {activeTab === 'sitevisits' ? 'site visits' : 'documents'} recorded yet.</p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-64 lg:flex-shrink-0 border-t lg:border-t-0 lg:border-l border-stone-surface overflow-auto p-4 space-y-4 bg-[#fcfbf9]">
            {/* Customer Info */}
            <div>
              <h3 className="text-[10px] font-semibold text-muted-gray uppercase tracking-wide mb-2">Contact</h3>
              <div className="space-y-1.5">
                <InfoRow icon={<Phone className="w-3 h-3" />} label={formatPhone(lead.phone)} />
                {lead.alternatePhone && (
                  <InfoRow icon={<Phone className="w-3 h-3" />} label={formatPhone(lead.alternatePhone)} />
                )}
                {lead.email && (
                  <InfoRow icon={<Mail className="w-3 h-3" />} label={lead.email} />
                )}
                {lead.location && (
                  <InfoRow icon={<MapPin className="w-3 h-3" />} label={lead.location} />
                )}
              </div>
            </div>

            {/* Lead Score */}
            <div>
              <h3 className="text-[10px] font-semibold text-muted-gray uppercase tracking-wide mb-2">Lead Score</h3>
              <LeadScore score={lead.score} size="md" />
            </div>

            {/* Property Interest */}
            <div>
              <h3 className="text-[10px] font-semibold text-muted-gray uppercase tracking-wide mb-2">Property Interest</h3>
              <div className="space-y-1.5">
                {lead.propertyType && (
                  <InfoRow icon={<Home className="w-3 h-3" />} label={lead.propertyType} />
                )}
                {lead.budget && (
                  <InfoRow
                    icon={<DollarSign className="w-3 h-3" />}
                    label={`${formatCurrency(lead.budget)}${lead.budgetMax ? ` – ${formatCurrency(lead.budgetMax)}` : ''}`}
                  />
                )}
                {lead.projectInterest && (
                  <InfoRow icon={<Building2 className="w-3 h-3" />} label={lead.projectInterest} />
                )}
              </div>
            </div>

            {/* Assignment */}
            <div>
              <h3 className="text-[10px] font-semibold text-muted-gray uppercase tracking-wide mb-2">Assigned To</h3>
              {lead.assignedToName ? (
                <div className="flex items-center gap-2">
                  <Avatar name={lead.assignedToName} size="sm" />
                  <div>
                    <p className="text-xs font-semibold text-heading-charcoal">{lead.assignedToName}</p>
                    <p className="text-xs text-muted-gray">Sales Executive</p>
                  </div>
                </div>
              ) : (
                <button className="flex items-center gap-1.5 text-xs text-ink-black hover:underline font-semibold">
                  <UserPlus className="w-3.5 h-3.5" /> Assign someone
                </button>
              )}
            </div>

            {/* Next Follow-up */}
            <div>
              <h3 className="text-[10px] font-semibold text-muted-gray uppercase tracking-wide mb-2">Next Follow-up</h3>
              {lead.nextFollowUp ? (
                <div className="p-2.5 rounded-cards border border-stone-border bg-sun-yellow/10">
                  <p className="text-xs font-bold text-ink-black">
                    {formatDate(lead.nextFollowUp, 'long')}
                  </p>
                  <p className="text-xs text-body-brown mt-0.5">Phone Call</p>
                </div>
              ) : (
                <button className="flex items-center gap-1.5 text-xs text-ink-black hover:underline font-semibold">
                  <CalendarPlus className="w-3.5 h-3.5" /> Schedule follow-up
                </button>
              )}
            </div>

            {/* Activity Summary */}
            <div>
              <h3 className="text-[10px] font-semibold text-muted-gray uppercase tracking-wide mb-2">Activity</h3>
              <div className="space-y-1">
                <MetaRow label="Follow-ups" value={lead.followUpCount} />
                <MetaRow label="Site Visits" value={lead.siteVisitCount} />
                <MetaRow label="Last Contact" value={lead.lastContactedAt ? formatDate(lead.lastContactedAt, 'relative') : '—'} />
                <MetaRow label="Created" value={formatDate(lead.createdAt, 'short')} />
              </div>
            </div>

            {/* Telemetry Metric Score */}
            <div className="pt-3 border-t border-stone-border mt-3 text-center select-none">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-stone-border bg-stone-surface text-xl font-bold text-ink-black mb-1">
                {lead.score}
              </div>
              <p className="text-[10px] font-bold text-heading-charcoal mt-1">Lead Telemetry Score</p>
              <p className="text-[9px] text-muted-gray leading-tight">Target value score calculation.</p>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  )
}

// Sub-components
function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-body-brown">
      <span className="text-muted-gray flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-muted-gray">{label}</span>
      <span className="text-xs font-semibold text-heading-charcoal">{value}</span>
    </div>
  )
}

function OverviewTab({ lead }: { lead: ReturnType<typeof generateMockLeads>[0] }) {
  return (
    <div className="space-y-5 max-w-2xl">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Follow-ups', value: lead.followUpCount, icon: Phone },
          { label: 'Site Visits', value: lead.siteVisitCount, icon: Building2 },
          { label: 'Lead Score', value: lead.score, icon: Star },
          { label: 'Days Active', value: Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000), icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#fcfbf9] rounded-cards p-3 border border-stone-border">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3.5 h-3.5 text-muted-gray" />
              <span className="text-xs text-muted-gray">{label}</span>
            </div>
            <p className="text-xl font-bold text-heading-charcoal">{value}</p>
          </div>
        ))}
      </div>

      {/* Notes Preview */}
      {lead.notes && (
        <div>
          <h3 className="text-sm font-semibold text-heading-charcoal mb-2">Notes</h3>
          <div className="p-3 rounded-cards border border-stone-border bg-[#fcfbf9]">
            <p className="text-xs text-body-brown leading-relaxed">{lead.notes}</p>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-semibold text-heading-charcoal mb-3">Recent Activity</h3>
        <div className="space-y-3">
          {MOCK_ACTIVITIES.slice(0, 3).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: activity.bg, color: activity.color, border: '1px solid var(--color-stone-border)' }}
              >
                <activity.icon className="w-3 h-3" />
              </div>
              <div>
                <p className="text-xs text-heading-charcoal font-medium">{activity.description}</p>
                <p className="text-xs text-muted-gray mt-0.5">{activity.by} · {activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TimelineTab() {
  return (
    <div className="max-w-2xl">
      <div className="space-y-0">
        {MOCK_ACTIVITIES.map((activity, i) => (
          <div key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: activity.bg, color: activity.color, border: '1px solid var(--color-stone-border)' }}
              >
                <activity.icon className="w-3 h-3" />
              </div>
              {i < MOCK_ACTIVITIES.length - 1 && <div className="w-px flex-1 bg-stone-border my-1" />}
            </div>
            <div className="pb-4 min-w-0">
              <p className="text-xs font-semibold text-heading-charcoal">{activity.description}</p>
              <p className="text-xs text-muted-gray mt-0.5">{activity.by} · {activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FollowUpsTab() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-heading-charcoal">Follow-ups ({MOCK_FOLLOW_UPS.length})</h3>
        <Button variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />}>
          Schedule Follow-up
        </Button>
      </div>
      <div className="space-y-3">
        {MOCK_FOLLOW_UPS.map((fu) => {
          const getStatusDetails = (status: string) => {
            if (status === 'completed') return { color: 'var(--color-grass-green)', bg: 'rgba(0, 202, 72, 0.08)' }
            if (status === 'missed') return { color: 'var(--color-alert-red)', bg: 'rgba(224, 36, 36, 0.08)' }
            return { color: 'var(--color-sky-blue)', bg: 'rgba(0, 134, 252, 0.08)' }
          }
          const { color: statusColor, bg: statusBg } = getStatusDetails(fu.status)
          return (
            <div key={fu.id} className="p-3 rounded-cards border border-stone-border bg-[#fcfbf9]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-heading-charcoal">
                    {FOLLOW_UP_TYPE_LABELS[fu.type as keyof typeof FOLLOW_UP_TYPE_LABELS]}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize border"
                    style={{ backgroundColor: statusBg, color: statusColor, borderColor: statusColor + '20' }}
                  >
                    {fu.status}
                  </span>
                </div>
                <span className="text-xs text-muted-gray">{formatDate(fu.scheduledAt, 'long')}</span>
              </div>
              <p className="text-xs text-body-brown">{fu.notes}</p>
              {fu.outcome && (
                <p className="text-xs text-grass-green mt-1 font-semibold">✓ {fu.outcome}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NotesTab({ lead }: { lead: ReturnType<typeof generateMockLeads>[0] }) {
  const [newNote, setNewNote] = useState('')

  return (
    <div className="max-w-2xl space-y-4">
      {/* Add Note */}
      <div className="p-3 rounded-cards border border-stone-border bg-[#fcfbf9]">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note about this lead..."
          className="w-full text-xs text-heading-charcoal placeholder:text-muted-gray resize-none border-0 outline-none bg-transparent"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <Button variant="primary" size="sm" disabled={!newNote.trim()}>
            Add Note
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {MOCK_NOTES.map((note) => (
          <div key={note.id} className="p-3 rounded-cards border border-stone-border bg-white">
            <p className="text-xs text-body-brown leading-relaxed">{note.text}</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <Avatar name={note.by} size="xs" />
                <span className="text-xs font-medium text-heading-charcoal">{note.by}</span>
              </div>
              <span className="text-xs text-muted-gray">{note.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
