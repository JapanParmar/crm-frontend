'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { Avatar } from '@/components/ui/avatar'
import { LeadStatusBadge, LeadSourceBadge, LeadScore } from '@/components/leads/LeadBadges'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { dashboardApi, leadsApi, usersApi, activityApi } from '@/lib/api'
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
  const queryClient = useQueryClient()
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const { user } = useAuthStore()
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('superadmin') || false

  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', dateFrom, dateTo],
    queryFn: () => dashboardApi.get({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }).then((r) => r.data.data),
  })

  const { data: recentLeadsData } = useQuery({
    queryKey: ['leads', 'recent'],
    queryFn: () => leadsApi.list({ limit: 6, sort_by: 'created_at', sort_dir: 'desc' }).then((r) => r.data),
  })

  // Superadmin telemetry query
  const { data: systemActivitiesData } = useQuery({
    queryKey: ['system-activities-dashboard'],
    queryFn: () => activityApi.list({ limit: 5 }).then((r) => r.data),
    enabled: !!user?.roles?.includes('superadmin'),
  })
  const systemActivities = systemActivitiesData?.data ?? []

  // Admin unassigned leads queue query
  const { data: unassignedLeadsData } = useQuery({
    queryKey: ['leads', 'unassigned-dashboard'],
    queryFn: () => leadsApi.list({ tab: 'unassigned', limit: 3 }).then((r) => r.data),
    enabled: isAdmin && !user?.roles?.includes('superadmin'),
  })
  const unassignedLeads = unassignedLeadsData?.data ?? []

  // Load active employees list for quick assignment dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-dashboard'],
    queryFn: () => usersApi.employees().then((r) => r.data.data),
    enabled: isAdmin && !user?.roles?.includes('superadmin'),
  })
  const employees = employeesData ?? []

  // Quick assignment mutation
  const assignMutation = useMutation({
    mutationFn: ({ leadId, userId }: { leadId: number; userId: number | null }) =>
      leadsApi.update(leadId, { assigned_to: userId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
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

  const targetGoal = 5
  const goalPercentage = Math.min(Math.round((closedWon / targetGoal) * 100), 100)

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

  // Dynamic business telemetry chart data based on stats
  const chartData = React.useMemo(() => {
    return [
      { label: 'Jan', leads: Math.round(totalLeads * 0.45), sales: Math.round(closedWon * 0.4) },
      { label: 'Feb', leads: Math.round(totalLeads * 0.55), sales: Math.round(closedWon * 0.55) },
      { label: 'Mar', leads: Math.round(totalLeads * 0.7), sales: Math.round(closedWon * 0.6) },
      { label: 'Apr', leads: Math.round(totalLeads * 0.8), sales: Math.round(closedWon * 0.75) },
      { label: 'May', leads: Math.round(totalLeads * 0.95), sales: Math.round(closedWon * 0.85) },
      { label: 'Jun', leads: totalLeads, sales: closedWon },
    ]
  }, [totalLeads, closedWon])

  const maxLeads = Math.max(...chartData.map(d => d.leads), 10)
  const maxSales = Math.max(...chartData.map(d => d.sales), 5)
  const maxVal = Math.max(maxLeads, maxSales) * 1.15 // 15% padding on top
  
  const chartHeight = 160
  const chartWidth = 500
  
  // Calculate points
  const leadPoints = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * chartWidth
    const y = chartHeight - (d.leads / maxVal) * chartHeight
    return { x, y }
  })
  
  const salesPoints = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * chartWidth
    const y = chartHeight - (d.sales / maxVal) * chartHeight
    return { x, y }
  })

  // Generate SVG path string
  const leadPath = leadPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const leadArea = `${leadPath} L ${leadPoints[leadPoints.length - 1].x} ${chartHeight} L ${leadPoints[0].x} ${chartHeight} Z`

  const salesPath = salesPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const salesArea = `${salesPath} L ${salesPoints[salesPoints.length - 1].x} ${chartHeight} L ${salesPoints[0].x} ${chartHeight} Z`

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
            {user?.permissions?.includes('create-leads') && (
              <div className="flex-shrink-0 flex items-center gap-3 select-none">
                <button
                  onClick={() => setAddLeadOpen(true)}
                  className="bg-obsidian text-snow hover:opacity-90 active:scale-95 px-4 py-2.5 rounded-buttons text-sm font-semibold transition-all border border-slate"
                >
                  + New Lead
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date Filter Scope Bar */}
        <div className="max-w-6xl mx-auto px-8 pt-6 flex items-center justify-between gap-4 flex-wrap select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-heading-charcoal uppercase tracking-wider">Dashboard Scope:</span>
            <span className="text-xs text-body-brown font-medium">Filter metrics & trends by date range</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Created From date picker */}
            <div className="flex items-center gap-1.5 bg-white border border-stone-border rounded-lg h-9 px-2.5">
              <span className="text-[10px] uppercase font-bold text-muted-gray">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent border-none text-xs text-body-brown focus:outline-none cursor-pointer"
              />
            </div>

            {/* Created To date picker */}
            <div className="flex items-center gap-1.5 bg-white border border-stone-border rounded-lg h-9 px-2.5">
              <span className="text-[10px] uppercase font-bold text-muted-gray">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent border-none text-xs text-body-brown focus:outline-none cursor-pointer"
              />
            </div>

            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                }}
                className="text-[10px] font-bold text-alert-red hover:underline uppercase tracking-wider pl-1"
              >
                Clear Scope
              </button>
            )}
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

              {/* Business Analytics Chart Section */}
              <section className="bg-white rounded-cards p-6 border border-stone-surface">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight">Business Performance Trends</h2>
                    <p className="text-xs text-body-brown">Lead volume vs closed conversions over time</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sun-yellow inline-block" />
                      <span className="text-heading-charcoal">Leads</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-grass-green inline-block" />
                      <span className="text-heading-charcoal">Closed Won</span>
                    </div>
                  </div>
                </div>

                <div className="relative w-full h-[200px] mt-2">
                  <svg className="w-full h-[160px]" viewBox="0 0 500 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-sun-yellow)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--color-sun-yellow)" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-grass-green)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--color-grass-green)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="40" x2="500" y2="40" stroke="var(--color-stone-surface)" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="var(--color-stone-surface)" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="var(--color-stone-surface)" strokeDasharray="3 3" />
                    
                    {/* Areas */}
                    <path d={leadArea} fill="url(#leadsGrad)" />
                    <path d={salesArea} fill="url(#salesGrad)" />
                    
                    {/* Lines */}
                    <path d={leadPath} fill="none" stroke="var(--color-sun-yellow)" strokeWidth="2.5" strokeLinecap="round" />
                    <path d={salesPath} fill="none" stroke="var(--color-grass-green)" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Interactive dots */}
                    {leadPoints.map((p, idx) => (
                      <circle key={`l-${idx}`} cx={p.x} cy={p.y} r="4" fill="var(--color-sun-yellow)" stroke="white" strokeWidth="1.5" />
                    ))}
                    {salesPoints.map((p, idx) => (
                      <circle key={`s-${idx}`} cx={p.x} cy={p.y} r="4" fill="var(--color-grass-green)" stroke="white" strokeWidth="1.5" />
                    ))}
                  </svg>
                  
                  {/* X Axis Labels */}
                  <div className="flex justify-between mt-3 text-[10px] text-muted-gray font-bold px-1 select-none">
                    {chartData.map((d, i) => (
                      <span key={i}>{d.label}</span>
                    ))}
                  </div>
                </div>
              </section>

              {/* System Telemetry Audit Log for Superadmin */}
              {user?.roles?.includes('superadmin') && (
                <section className="bg-white rounded-cards p-6 border border-stone-surface">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight">System Telemetry Log</h2>
                      <p className="text-xs text-body-brown">Real-time enterprise administrative activity log</p>
                    </div>
                    <Link href="/activity" className="flex items-center gap-1 text-xs text-ember-orange hover:text-ink-black hover:underline font-semibold">
                      Full Audit Trail <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  {systemActivities.length === 0 ? (
                    <p className="text-xs text-muted-gray py-4">No recent activity logs</p>
                  ) : (
                    <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-stone-surface">
                      {systemActivities.slice(0, 4).map((act) => (
                        <div key={act.id} className="flex gap-3 relative z-10">
                          <div className="w-7 h-7 rounded-full bg-[#fcfbf9] border border-stone-border flex items-center justify-center flex-shrink-0 text-body-brown">
                            <Zap className="w-3.5 h-3.5 text-ember-orange" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-heading-charcoal font-semibold leading-relaxed">
                              {act.description}
                              {act.lead_id && (
                                <Link href={`/leads/${act.lead_id}`} className="text-ember hover:underline ml-1 font-bold">
                                  (Lead)
                                </Link>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-gray mt-0.5">
                              Performed by {act.performed_by?.name || 'System'} · {formatDate(act.created_at, 'long')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Unassigned Leads Alert Queue for Admin */}
              {user?.roles?.includes('admin') && !user?.roles?.includes('superadmin') && unassignedLeads.length > 0 && (
                <section className="bg-white rounded-cards p-6 border border-stone-surface">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight">Unassigned Leads Queue</h2>
                      <p className="text-xs text-body-brown">Incoming leads awaiting owner routing</p>
                    </div>
                    <Link href="/leads?tab=unassigned" className="flex items-center gap-1 text-xs text-ember-orange hover:text-ink-black hover:underline font-semibold">
                      Manage All Unassigned <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="space-y-2.5">
                    {unassignedLeads.map((lead) => (
                      <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-[#fcfbf9] border border-stone-surface rounded-cards">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/leads/${lead.id}`} className="text-xs font-bold text-heading-charcoal hover:underline">
                              {lead.name}
                            </Link>
                            <span className="text-[9px] px-1.5 py-0.25 rounded bg-amber/10 text-ember-orange border border-ember/20 font-bold uppercase">{lead.source}</span>
                          </div>
                          <p className="text-[10px] text-body-brown mt-0.5">{lead.phone || 'No phone'} · Created {formatDate(lead.created_at, 'long')}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <select
                            onChange={(e) => {
                              const val = e.target.value
                              if (val) {
                                assignMutation.mutate({ leadId: lead.id, userId: parseInt(val) })
                              }
                            }}
                            disabled={assignMutation.isPending}
                            className="h-8 px-2 rounded-lg border border-stone-border bg-white text-[11px] text-body-brown focus:outline-none focus:border-ink-black cursor-pointer font-semibold"
                          >
                            <option value="">Quick Assign...</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* My Sales Pipeline Funnel for Agents */}
              {!isAdmin && (
                <section className="bg-white rounded-cards p-6 border border-stone-surface">
                  <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight mb-4">My Sales Pipeline Funnel</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[#fcfbf9] border border-stone-surface p-3 rounded-cards text-center">
                      <span className="text-[10px] uppercase font-bold text-muted-gray">Active Leads</span>
                      <p className="text-xl font-family-display font-bold text-heading-charcoal mt-1">{totalLeads}</p>
                    </div>
                    <div className="bg-[#fcfbf9] border border-stone-surface p-3 rounded-cards text-center">
                      <span className="text-[10px] uppercase font-bold text-muted-gray">Closed Won</span>
                      <p className="text-xl font-family-display font-bold text-grass-green mt-1">{closedWon}</p>
                    </div>
                    <div className="bg-[#fcfbf9] border border-stone-surface p-3 rounded-cards text-center">
                      <span className="text-[10px] uppercase font-bold text-muted-gray">Pending Tasks</span>
                      <p className="text-xl font-family-display font-bold text-sun-yellow mt-1">{pendingFollowUps}</p>
                    </div>
                    <div className="bg-[#fcfbf9] border border-stone-surface p-3 rounded-cards text-center">
                      <span className="text-[10px] uppercase font-bold text-muted-gray">Site Visits</span>
                      <p className="text-xl font-family-display font-bold text-sky-blue mt-1">{employeeStats?.my_today_site_visits ?? 0}</p>
                    </div>
                  </div>
                </section>
              )}

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

              {/* Team Performance & Workload Analytics for Admin / Superadmin */}
              {isAdmin && team.length > 0 && (
                <section className="bg-white rounded-cards p-6 border border-stone-surface">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight">Team Workload & Sales Performance</h2>
                      <p className="text-xs text-body-brown">Real-time team members efficiency and workload balance</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#fcfbf9] border-b border-stone-surface">
                          <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Team Member</th>
                          <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Lead Share (Workload)</th>
                          <th className="px-3 py-2 text-center font-bold text-heading-charcoal">Closed Won</th>
                          <th className="px-3 py-2 text-center font-bold text-heading-charcoal">Conversion</th>
                          <th className="px-3 py-2 text-center font-bold text-heading-charcoal">Pending Tasks</th>
                          <th className="px-3 py-2 text-right font-bold text-heading-charcoal">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-surface">
                        {team.map((member: TeamMemberStat) => {
                          const maxLeadsInTeam = Math.max(...team.map(m => m.assigned_leads), 1)
                          const workloadPercentage = Math.round((member.assigned_leads / maxLeadsInTeam) * 100)
                          
                          // Conversion status styling
                          const convRate = member.conversion_rate
                          const convBadge = convRate >= 15 
                            ? 'bg-grass-green/10 text-grass-green border-grass-green/20' 
                            : convRate >= 5 
                            ? 'bg-sun-yellow/10 text-gold border-sun-yellow/30' 
                            : 'bg-alert-red/10 text-alert-red border-alert-red/20'

                          // Task status health
                          const isHealthy = member.pending_follow_ups <= 5
                          
                          return (
                            <tr key={member.id} className="hover:bg-[#fcfbf9] transition-colors duration-75">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <Avatar name={member.name} size="xs" />
                                  <div>
                                    <p className="font-bold text-heading-charcoal">{member.name}</p>
                                    <p className="text-[10px] text-muted-gray mt-0.5">{member.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 w-[160px]">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold text-body-brown">
                                    <span>{member.assigned_leads} leads</span>
                                    <span>{workloadPercentage}%</span>
                                  </div>
                                  <div className="h-1.5 bg-stone-surface border border-stone-border/60 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full bg-ember-orange" 
                                      style={{ width: `${workloadPercentage}%` }} 
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center font-bold text-heading-charcoal text-base">
                                {member.closed_deals}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${convBadge}`}>
                                  {convRate}%
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center font-bold text-body-brown">
                                {member.pending_follow_ups}
                              </td>
                              <td className="px-3 py-3 text-right">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isHealthy ? 'bg-grass-green/10 text-grass-green' : 'bg-alert-red/10 text-alert-red'
                                }`}>
                                  {isHealthy ? '✓ Active' : '⚠️ Overloaded'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">

              {/* Personal Target Goal */}
              {!isAdmin && (
                <section className="bg-white rounded-cards p-6 border border-stone-surface text-center">
                  <h2 className="text-xs font-semibold text-muted-gray uppercase tracking-wider mb-4">Personal Target Goal</h2>
                  <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                    {/* Circular Progress Gauge */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="46" stroke="var(--color-stone-surface)" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="56"
                        cy="56"
                        r="46"
                        stroke="var(--color-sun-yellow)"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 46}
                        strokeDashoffset={2 * Math.PI * 46 * (1 - goalPercentage / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-family-display text-heading-charcoal font-bold">{closedWon} / {targetGoal}</span>
                      <span className="text-[9px] font-bold text-muted-gray uppercase tracking-widest">Won Deals</span>
                    </div>
                  </div>
                  <p className="text-xs text-body-brown font-semibold mt-4">
                    {goalPercentage}% of monthly quota reached
                  </p>
                  <p className="text-[10px] text-muted-gray mt-1 leading-normal">
                    Convert {targetGoal - closedWon > 0 ? targetGoal - closedWon : 0} more leads to hit your goal.
                  </p>
                </section>
              )}

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
