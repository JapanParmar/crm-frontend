'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { Avatar } from '@/components/ui/avatar'
import { LeadStatusBadge, LeadSourceBadge, LeadScore } from '@/components/leads/LeadBadges'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { generateMockLeads, LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  Users,
  TrendingUp,
  Phone,
  Building2,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  MessageSquare,
  Mail,
  CalendarCheck,
} from 'lucide-react'
import Link from 'next/link'
import { Zap } from 'lucide-react'

const mockLeads = generateMockLeads(50)

const kpiStats = {
  totalLeads: 847,
  newToday: 12,
  activeLeads: 423,
  closedWon: 89,
  closedLost: 54,
  conversionRate: 17.4,
  pendingFollowUps: 38,
  todayFollowUps: 14,
  scheduledSiteVisits: 6,
  revenue: 284500000,
}

const todayFollowUps = [
  { id: '1', name: 'Rahul Sharma', phone: '9876543210', type: 'call', time: '10:00 AM', status: 'scheduled', assignee: 'Arjun Rathore' },
  { id: '2', name: 'Priya Patel', phone: '9123456789', type: 'site_visit', time: '11:30 AM', status: 'scheduled', assignee: 'Sneha Kapoor' },
  { id: '3', name: 'Amit Kumar', phone: '9345678901', type: 'whatsapp', time: '2:00 PM', status: 'scheduled', assignee: 'Dev Malhotra' },
  { id: '4', name: 'Sunita Verma', phone: '9234567890', type: 'call', time: '3:30 PM', status: 'missed', assignee: 'Priti Saxena' },
  { id: '5', name: 'Vikash Singh', phone: '9456789012', type: 'email', time: '4:00 PM', status: 'completed', assignee: 'Arjun Rathore' },
]

const teamPerformance = [
  { name: 'Arjun Rathore', leads: 124, closed: 28, conversion: 22.6, followUps: 8 },
  { name: 'Sneha Kapoor', leads: 98, closed: 19, conversion: 19.4, followUps: 12 },
  { name: 'Dev Malhotra', leads: 112, closed: 24, conversion: 21.4, followUps: 5 },
  { name: 'Priti Saxena', leads: 87, closed: 18, conversion: 20.7, followUps: 13 },
]

const sourceBreakdown = [
  { source: 'magicbricks', count: 187, percentage: 22 },
  { source: 'meta_ads', count: 165, percentage: 19 },
  { source: 'google_ads', count: 143, percentage: 17 },
  { source: '99acres', count: 128, percentage: 15 },
  { source: 'website', count: 97, percentage: 11 },
]

const FOLLOW_UP_TYPE_ICONS = {
  call: <PhoneCall className="w-3 h-3" />,
  whatsapp: <MessageSquare className="w-3 h-3" />,
  email: <Mail className="w-3 h-3" />,
  site_visit: <Building2 className="w-3 h-3" />,
  meeting: <CalendarCheck className="w-3 h-3" />,
}

const FOLLOW_UP_STATUS_COLORS = {
  scheduled: { bg: 'var(--color-stone-surface)', text: 'var(--color-body-brown)' },
  completed: { bg: 'rgba(0, 202, 72, 0.08)', text: 'var(--color-grass-green)' },
  missed: { bg: 'rgba(224, 36, 36, 0.08)', text: 'var(--color-alert-red)' },
  cancelled: { bg: 'var(--color-stone-surface)', text: 'var(--color-muted-gray)' },
}

export default function DashboardPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const recentLeads = mockLeads.slice(0, 6)

  return (
    <AppShell>
      <AppHeader title="Dashboard" subtitle="Overview of your CRM activity" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex-1 overflow-auto bg-cream-canvas" style={{ paddingTop: '56px' }}>
        {/* Storybook Hero Introduction */}
        <div className="relative px-8 py-10 bg-cream-canvas border-b border-stone-surface overflow-hidden">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center px-2 py-0.5 rounded-badges bg-ember text-white font-semibold text-xs mb-3 select-none">
                BRICKroots CRM Workspace
              </div>
              <h1 className="font-family-display text-4xl md:text-5xl text-ink-black tracking-tight leading-none mb-3">
                Infrastructure-grade lead telemetry.
              </h1>
              <p className="text-body-brown font-medium text-sm md:text-base max-w-2xl leading-relaxed">
                Track leads, orchestrate site visits, and optimize your sales conversion funnel on a quiet, high-density dashboard.
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-3 relative select-none">
              <button
                onClick={() => setAddLeadOpen(true)}
                className="bg-obsidian text-snow hover:opacity-90 active:scale-95 px-4 py-2.5 rounded-buttons text-sm font-semibold transition-all border border-slate"
              >
                + New Lead
              </button>
            </div>
          </div>
        </div>

        {/* Storybook KPI Stats Grid */}
        <section className="px-8 py-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-cards p-6 border border-stone-surface relative overflow-hidden transition-all hover:border-stone-border">
              <p className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-1">Total Leads</p>
              <h3 className="font-family-display text-3xl text-heading-charcoal mb-1">{kpiStats.totalLeads.toLocaleString()}</h3>
              <p className="text-xs text-body-brown font-medium">
                <span className="text-grass-green font-bold">↑ 8.2%</span> vs last month
              </p>
            </div>

            <div className="bg-white rounded-cards p-6 border border-stone-surface relative overflow-hidden transition-all hover:border-stone-border">
              <p className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-1">Closed Won</p>
              <h3 className="font-family-display text-3xl text-heading-charcoal mb-1">{kpiStats.closedWon}</h3>
              <p className="text-xs text-body-brown font-medium">
                <span className="text-grass-green font-bold">17.4%</span> conversion rate
              </p>
            </div>

            <div className="bg-white rounded-cards p-6 border border-stone-surface relative overflow-hidden transition-all hover:border-stone-border">
              <p className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-1">Pending Follow-ups</p>
              <h3 className="font-family-display text-3xl text-heading-charcoal mb-1">{kpiStats.pendingFollowUps}</h3>
              <p className="text-xs text-body-brown font-medium">
                <span className="text-alert-red font-bold">{kpiStats.todayFollowUps} due today</span>
              </p>
            </div>

            <div className="bg-white rounded-cards p-6 border border-stone-surface relative overflow-hidden transition-all hover:border-stone-border">
              <p className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-1">Revenue MTD</p>
              <h3 className="font-family-display text-3xl text-heading-charcoal mb-1">{formatCurrency(kpiStats.revenue)}</h3>
              <p className="text-xs text-body-brown font-medium">
                <span className="text-grass-green font-bold">↑ 5.7%</span> vs last month
              </p>
            </div>
          </div>
        </section>

        {/* Main Content Layout */}
        <div className="max-w-6xl mx-auto px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (Main Stats / Lists) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Today's Follow-ups */}
              <section className="bg-white rounded-cards p-6 border border-stone-surface relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight">Today's Active Schedule</h2>
                    <p className="text-xs text-body-brown">{kpiStats.todayFollowUps} events scheduled for today</p>
                  </div>
                  <Link
                    href="/follow-ups"
                    className="flex items-center gap-1 text-xs text-ember-orange hover:text-ink-black hover:underline font-semibold"
                  >
                    Manage Follow-ups <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-2">
                  {todayFollowUps.map((fu) => {
                    const statusColors = FOLLOW_UP_STATUS_COLORS[fu.status as keyof typeof FOLLOW_UP_STATUS_COLORS]
                    return (
                      <div
                        key={fu.id}
                        className="flex items-center gap-3 p-3 rounded-cards bg-[#fcfbf9] border border-stone-surface hover:border-stone-border transition-all duration-100 cursor-pointer group"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border border-stone-border"
                          style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                        >
                          {FOLLOW_UP_TYPE_ICONS[fu.type as keyof typeof FOLLOW_UP_TYPE_ICONS]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-heading-charcoal">{fu.name}</span>
                            <span
                              className="text-[9px] px-1.5 py-0.25 rounded-full border border-stone-border font-bold uppercase"
                              style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                            >
                              {fu.status}
                            </span>
                          </div>
                          <p className="text-xs text-body-brown">{fu.phone} · {fu.assignee}</p>
                        </div>
                        <span className="text-xs font-bold text-heading-charcoal flex-shrink-0 mr-1">{fu.time}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={`tel:${fu.phone}`} className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black">
                            <PhoneCall className="w-3 h-3" />
                          </a>
                          <a href={`https://wa.me/91${fu.phone}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black">
                            <MessageSquare className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Recent Lead Characters */}
              <section className="bg-white rounded-cards p-6 border border-stone-surface">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight">Recent Lead Characters</h2>
                    <p className="text-xs text-body-brown">New entries added to your real estate book</p>
                  </div>
                  <Link
                    href="/leads"
                    className="flex items-center gap-1 text-xs text-ember-orange hover:text-ink-black hover:underline font-semibold"
                  >
                    Browse Roster <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#fcfbf9] border-b border-stone-surface">
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Character</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Origin Source</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Status</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Interest Score</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Max Budget</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-surface">
                      {recentLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-[#fcfbf9] cursor-pointer group transition-colors duration-75">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={lead.name} size="xs" />
                              <div>
                                <Link href={`/leads/${lead.id}`} className="font-bold text-heading-charcoal hover:text-ink-black hover:underline">
                                  {lead.name}
                                </Link>
                                <p className="text-[10px] text-body-brown mt-0.5">{lead.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <LeadSourceBadge source={lead.source} />
                          </td>
                          <td className="px-3 py-3">
                            <LeadStatusBadge status={lead.status} dot />
                          </td>
                          <td className="px-3 py-3">
                            <LeadScore score={lead.score} />
                          </td>
                          <td className="px-3 py-3 font-semibold text-heading-charcoal">
                            {lead.budget ? formatCurrency(lead.budget) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Right Column (Side Panels) */}
            <div className="space-y-6">
              
              {/* Attention Alerts */}
              <section className="bg-white rounded-cards p-6 border border-stone-surface">
                <h2 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-3">Attention Required</h2>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-3 rounded-cards bg-alert-red/5 border border-alert-red/20">
                    <AlertCircle className="w-4 h-4 text-alert-red mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-alert-red">8 follow-ups missed</p>
                      <p className="text-[11px] text-body-brown leading-normal mt-0.5">Please check and reschedule overdue calls.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-cards bg-sun-yellow/10 border border-sun-yellow/30">
                    <Clock className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-heading-charcoal">14 cold leads</p>
                      <p className="text-[11px] text-body-brown leading-normal mt-0.5">No contact recorded in the last 5 days.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Lead Sources */}
              <section className="bg-white rounded-cards p-6 border border-stone-surface">
                <h2 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-3">Lead Channels</h2>
                <div className="space-y-3">
                  {sourceBreakdown.map(({ source, count, percentage }) => (
                    <div key={source} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-heading-charcoal">
                        <span>{LEAD_SOURCE_LABELS[source as keyof typeof LEAD_SOURCE_LABELS]}</span>
                        <span>{count}</span>
                      </div>
                      <div className="h-2 bg-stone-surface border border-stone-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sun-yellow"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Team performance */}
              <section className="bg-white rounded-cards p-6 border border-stone-surface">
                <h2 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-3">Team Performance</h2>
                <div className="space-y-3">
                  {teamPerformance.map((member) => (
                    <div key={member.name} className="flex items-center gap-2.5">
                      <Avatar name={member.name} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-heading-charcoal truncate">{member.name}</p>
                        <p className="text-[10px] text-body-brown">{member.leads} leads · {member.closed} closed</p>
                      </div>
                      <div className="text-right bg-sun-yellow/15 border border-stone-border/60 px-1.5 py-0.5 rounded-full">
                        <span className="text-[10px] font-bold text-gold">{member.conversion}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Team performance telemetry badge widget */}
              <div className="p-4 rounded-cards border border-stone-surface bg-cloud relative overflow-hidden flex items-center gap-3 select-none">
                <Zap className="w-8 h-8 text-ember flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-heading-charcoal">Conversion optimized</p>
                  <p className="text-[10px] text-body-brown mt-0.5">Your team has converted {kpiStats.closedWon} deals this month.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
