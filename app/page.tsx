'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { Avatar } from '@/components/ui/avatar'
import { LeadStatusBadge, LeadSourceBadge, LeadScore } from '@/components/leads/LeadBadges'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { dashboardApi, leadsApi } from '@/lib/api'
import type { AdminStats, EmployeeStats, TodayScheduleItem, TeamMemberStat } from '@/lib/api'
import { LEAD_SOURCE_LABELS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  AlertCircle,
  Clock,
  ArrowRight,
  PhoneCall,
  MessageSquare,
  Mail,
  Building2,
  CalendarCheck,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const FOLLOW_UP_TYPE_ICONS: Record<string, React.ReactNode> = {
  call: <PhoneCall className="w-3 h-3" />,
  whatsapp: <MessageSquare className="w-3 h-3" />,
  email: <Mail className="w-3 h-3" />,
  site_visit: <Building2 className="w-3 h-3" />,
  meeting: <CalendarCheck className="w-3 h-3" />,
}

const FOLLOW_UP_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: 'var(--color-stone-surface)', text: 'var(--color-body-brown)' },
  completed: { bg: 'rgba(0, 202, 72, 0.08)', text: 'var(--color-grass-green)' },
  missed: { bg: 'rgba(224, 36, 36, 0.08)', text: 'var(--color-alert-red)' },
  cancelled: { bg: 'var(--color-stone-surface)', text: 'var(--color-muted-gray)' },
}

function StatCard({ label, value, sub, subColor }: { label: string; value: string | number; sub?: string; subColor?: string }) {
  return (
    <div className="bg-white rounded-cards p-6 border border-stone-surface hover:border-stone-border transition-all">
      <p className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-1">{label}</p>
      <h3 className="font-family-display text-3xl text-heading-charcoal mb-1">{value}</h3>
      {sub && (
        <p className="text-xs text-body-brown font-medium">
          <span style={{ color: subColor }} className="font-bold">{sub}</span>
        </p>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-cards p-6 border border-stone-surface animate-pulse">
      <div className="h-3 w-24 bg-stone-surface rounded mb-2" />
      <div className="h-8 w-16 bg-stone-surface rounded mb-2" />
      <div className="h-3 w-20 bg-stone-surface rounded" />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const { user } = useAuthStore()
  const isAdmin = user?.roles?.includes('admin') ?? false

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then((r) => r.data.data),
  })

  const { data: recentLeadsData } = useQuery({
    queryKey: ['leads', 'recent'],
    queryFn: () => leadsApi.list({ limit: 6, sort_by: 'created_at', sort_dir: 'desc' }).then((r) => r.data),
  })

  const stats = dashboardData?.stats
  const todaySchedule = dashboardData?.today_schedule ?? []
  const team = dashboardData?.team ?? []
  const recentLeads = recentLeadsData?.data ?? []

  // Type-safe access helpers
  const adminStats = isAdmin ? (stats as AdminStats | undefined) : undefined
  const employeeStats = !isAdmin ? (stats as EmployeeStats | undefined) : undefined

  const totalLeads = adminStats?.total_leads ?? employeeStats?.my_leads ?? 0
  const closedWon = adminStats?.closed_won ?? employeeStats?.my_closed_won ?? 0
  const conversionRate = adminStats?.conversion_rate ?? 0
  const pendingFollowUps = adminStats?.pending_follow_ups ?? employeeStats?.my_pending_follow_ups ?? 0
  const todayFollowUps = adminStats?.today_follow_ups ?? employeeStats?.my_today_follow_ups ?? 0
  const overdueFollowUps = adminStats?.overdue_follow_ups ?? employeeStats?.my_overdue_follow_ups ?? 0
  const coldLeads = adminStats?.cold_leads ?? 0
  const missedFollowUps = adminStats?.missed_follow_ups ?? 0

  // Source breakdown
  const leadsBySource = adminStats?.leads_by_source ?? {}
  const totalSourceCount = Object.values(leadsBySource).reduce((a, b) => a + b, 0)
  const topSources = Object.entries(leadsBySource)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({
      source,
      count,
      percentage: totalSourceCount > 0 ? Math.round((count / totalSourceCount) * 100) : 0,
    }))

  return (
    <AppShell>
      <AppHeader title="Dashboard" subtitle="Overview of your CRM activity" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex-1 overflow-auto bg-cream-canvas" style={{ paddingTop: '56px' }}>
        {/* Hero */}
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
            <div className="flex-shrink-0 flex items-center gap-3 select-none">
              <button
                onClick={() => setAddLeadOpen(true)}
                className="bg-obsidian text-snow hover:opacity-90 active:scale-95 px-4 py-2.5 rounded-buttons text-sm font-semibold transition-all border border-slate"
              >
                + New Lead
              </button>
            </div>
          </div>
        </div>

        {/* KPI Stats */}
        <section className="px-8 py-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <StatCard
                  label={isAdmin ? 'Total Leads' : 'My Leads'}
                  value={totalLeads.toLocaleString()}
                  sub={adminStats ? `${adminStats.new_today} new today` : undefined}
                  subColor="var(--color-grass-green)"
                />
                <StatCard
                  label="Closed Won"
                  value={closedWon}
                  sub={isAdmin ? `${conversionRate}% conversion rate` : undefined}
                  subColor="var(--color-grass-green)"
                />
                <StatCard
                  label="Pending Follow-ups"
                  value={pendingFollowUps}
                  sub={`${todayFollowUps} due today`}
                  subColor="var(--color-alert-red)"
                />
                <StatCard
                  label={isAdmin ? 'Today Site Visits' : 'My Site Visits Today'}
                  value={adminStats?.today_site_visits ?? employeeStats?.my_today_site_visits ?? 0}
                  sub={isAdmin ? `${adminStats?.active_employees ?? 0} active employees` : undefined}
                  subColor="var(--color-body-brown)"
                />
              </>
            )}
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">

              {/* Today's Schedule */}
              <section className="bg-white rounded-cards p-6 border border-stone-surface relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight">Today's Active Schedule</h2>
                    <p className="text-xs text-body-brown">{todayFollowUps} events scheduled for today</p>
                  </div>
                  <Link href="/follow-ups" className="flex items-center gap-1 text-xs text-ember-orange hover:text-ink-black hover:underline font-semibold">
                    Manage Follow-ups <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {dashboardLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-12 bg-stone-surface rounded-cards animate-pulse" />
                    ))}
                  </div>
                ) : todaySchedule.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarCheck className="w-8 h-8 text-muted-gray mx-auto mb-2" />
                    <p className="text-xs text-muted-gray">No follow-ups scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaySchedule.map((fu: TodayScheduleItem) => {
                      const statusColors = FOLLOW_UP_STATUS_COLORS[fu.status] ?? FOLLOW_UP_STATUS_COLORS.scheduled
                      return (
                        <div
                          key={fu.id}
                          className="flex items-center gap-3 p-3 rounded-cards bg-[#fcfbf9] border border-stone-surface hover:border-stone-border transition-all duration-100 cursor-pointer group"
                          onClick={() => router.push(`/leads/${fu.lead_id}`)}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border border-stone-border"
                            style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                          >
                            {FOLLOW_UP_TYPE_ICONS[fu.type] ?? <CalendarCheck className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-heading-charcoal">{fu.lead_name}</span>
                              <span
                                className="text-[9px] px-1.5 py-0.25 rounded-full border border-stone-border font-bold uppercase"
                                style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                              >
                                {fu.status}
                              </span>
                            </div>
                            <p className="text-xs text-body-brown">{fu.phone} · {fu.assigned_to_name}</p>
                          </div>
                          <span className="text-xs font-bold text-heading-charcoal flex-shrink-0 mr-1">
                            {new Date(fu.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {fu.phone && (
                              <>
                                <a href={`tel:${fu.phone}`} className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black">
                                  <PhoneCall className="w-3 h-3" />
                                </a>
                                <a href={`https://wa.me/91${fu.phone}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black">
                                  <MessageSquare className="w-3 h-3" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Recent Leads Table */}
              <section className="bg-white rounded-cards p-6 border border-stone-surface">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight">Recent Leads</h2>
                    <p className="text-xs text-body-brown">Newest entries in your CRM</p>
                  </div>
                  <Link href="/leads" className="flex items-center gap-1 text-xs text-ember-orange hover:text-ink-black hover:underline font-semibold">
                    Browse All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#fcfbf9] border-b border-stone-surface">
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Lead</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Source</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Status</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Score</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Budget Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-surface">
                      {recentLeads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-muted-gray">No leads yet</td>
                        </tr>
                      ) : (
                        recentLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-[#fcfbf9] cursor-pointer group transition-colors duration-75" onClick={() => router.push(`/leads/${lead.id}`)}>
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
                            <td className="px-3 py-3"><LeadSourceBadge source={lead.source as never} /></td>
                            <td className="px-3 py-3"><LeadStatusBadge status={lead.status as never} dot /></td>
                            <td className="px-3 py-3"><LeadScore score={lead.score} /></td>
                            <td className="px-3 py-3 font-semibold text-heading-charcoal">
                              {lead.budget_max ? formatCurrency(lead.budget_max) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-6">

              {/* Attention Alerts */}
              <section className="bg-white rounded-cards p-6 border border-stone-surface">
                <h2 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-3">Attention Required</h2>
                <div className="space-y-2">
                  {(overdueFollowUps > 0 || missedFollowUps > 0) && (
                    <div className="flex items-start gap-2.5 p-3 rounded-cards bg-alert-red/5 border border-alert-red/20">
                      <AlertCircle className="w-4 h-4 text-alert-red mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-alert-red">
                          {overdueFollowUps > 0
                            ? `${overdueFollowUps} overdue follow-up${overdueFollowUps !== 1 ? 's' : ''}`
                            : `${missedFollowUps} follow-up${missedFollowUps !== 1 ? 's' : ''} missed`}
                        </p>
                        <p className="text-[11px] text-body-brown leading-normal mt-0.5">Please check and reschedule overdue calls.</p>
                      </div>
                    </div>
                  )}
                  {coldLeads > 0 && (
                    <div className="flex items-start gap-2.5 p-3 rounded-cards bg-sun-yellow/10 border border-sun-yellow/30">
                      <Clock className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-heading-charcoal">{coldLeads} cold leads</p>
                        <p className="text-[11px] text-body-brown leading-normal mt-0.5">No contact recorded in the last 5 days.</p>
                      </div>
                    </div>
                  )}
                  {overdueFollowUps === 0 && coldLeads === 0 && !dashboardLoading && (
                    <p className="text-xs text-muted-gray text-center py-4">All caught up! 🎉</p>
                  )}
                </div>
              </section>

              {/* Lead Channels */}
              {isAdmin && (
                <section className="bg-white rounded-cards p-6 border border-stone-surface">
                  <h2 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-3">Lead Channels</h2>
                  <div className="space-y-3">
                    {topSources.map(({ source, count, percentage }) => (
                      <div key={source} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-heading-charcoal">
                          <span>{LEAD_SOURCE_LABELS[source as keyof typeof LEAD_SOURCE_LABELS] ?? source}</span>
                          <span>{count}</span>
                        </div>
                        <div className="h-2 bg-stone-surface border border-stone-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-sun-yellow" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Team Performance */}
              {isAdmin && team.length > 0 && (
                <section className="bg-white rounded-cards p-6 border border-stone-surface">
                  <h2 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-3">Team Performance</h2>
                  <div className="space-y-3">
                    {(team as TeamMemberStat[]).map((member) => (
                      <div key={member.id} className="flex items-center gap-2.5">
                        <Avatar name={member.name} size="xs" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-heading-charcoal truncate">{member.name}</p>
                          <p className="text-[10px] text-body-brown">
                            {member.assigned_leads} leads · {member.closed_deals} closed
                          </p>
                        </div>
                        <div className="text-right bg-sun-yellow/15 border border-stone-border/60 px-1.5 py-0.5 rounded-full">
                          <span className="text-[10px] font-bold text-gold">{member.conversion_rate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Telemetry badge */}
              <div className="p-4 rounded-cards border border-stone-surface bg-cloud relative overflow-hidden flex items-center gap-3 select-none">
                <Zap className="w-8 h-8 text-ember flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-heading-charcoal">Conversion optimized</p>
                  <p className="text-[10px] text-body-brown mt-0.5">
                    Your team has converted {closedWon} deals this cycle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
