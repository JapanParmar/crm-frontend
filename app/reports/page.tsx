'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { dashboardApi, TeamMemberStat, AdminStats } from '@/lib/api'
import { DataTable } from '@/components/ui/data-table'
import { Avatar } from '@/components/ui/avatar'
import { createColumnHelper } from '@tanstack/react-table'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Map, 
  PieChart, 
  Loader2 
} from 'lucide-react'
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from '@/lib/constants'

const columnHelper = createColumnHelper<TeamMemberStat>()

export default function ReportsPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()

  // Fetch Dashboard Stats to build report
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['reports-dashboard'],
    queryFn: () => dashboardApi.get().then((r) => r.data.data),
  })

  const stats = dashboardData?.stats as AdminStats | undefined
  const team = dashboardData?.team ?? []

  // Table Columns definition using our new DataTable
  const columns = React.useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Sales Representative',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <Avatar name={info.getValue()} size="xs" />
          <span className="font-bold text-heading-charcoal">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('assigned_leads', {
      header: 'Assigned Leads',
      cell: (info) => <span className="font-medium text-body-brown">{info.getValue()}</span>,
    }),
    columnHelper.accessor('closed_deals', {
      header: 'Closed Deals',
      cell: (info) => (
        <span className="font-semibold text-grass-green">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('conversion_rate', {
      header: 'Conversion Rate',
      cell: (info) => (
        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-badges bg-sun-yellow/15 border border-stone-border/40 text-gold">
          {info.getValue()}%
        </span>
      ),
    }),
    columnHelper.accessor('pending_follow_ups', {
      header: 'Pending Tasks',
      cell: (info) => <span className="font-medium text-body-brown">{info.getValue()}</span>,
    }),
  ], [])

  // Calculate percentages for statuses
  const statusSummary = React.useMemo(() => {
    if (!stats?.leads_by_status) return []
    const raw = stats.leads_by_status
    const total = Object.values(raw).reduce((a, b) => a + b, 0)
    return Object.entries(raw).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      label: LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] ?? status,
    })).sort((a, b) => b.count - a.count)
  }, [stats])

  // Calculate percentages for sources
  const sourceSummary = React.useMemo(() => {
    if (!stats?.leads_by_source) return []
    const raw = stats.leads_by_source
    const total = Object.values(raw).reduce((a, b) => a + b, 0)
    return Object.entries(raw).map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      label: LEAD_SOURCE_LABELS[source as keyof typeof LEAD_SOURCE_LABELS] ?? source,
    })).sort((a, b) => b.count - a.count)
  }, [stats])

  return (
    <AppShell>
      <AppHeader title="Reports" subtitle="Analytics telemetry & performance metrics" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex flex-col h-full bg-cream-canvas select-none" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10">
          <PageHeader
            title="CRM Analytics Reports"
            description="Insightful metrics on lead sources and team performance."
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 max-w-6xl mx-auto w-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-muted-gray animate-spin" />
            </div>
          ) : !stats ? (
            <div className="text-center py-16 bg-white rounded-cards border border-stone-surface">
              <BarChart3 className="w-8 h-8 text-muted-gray mx-auto mb-2" />
              <p className="text-xs text-muted-gray">No report analytics data available.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Row: Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Stage funnel distribution */}
                <div className="bg-white rounded-cards border border-stone-surface p-5 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-4 h-4 text-muted-gray" />
                    <h3 className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">
                      Leads Pipeline Stage Funnel
                    </h3>
                  </div>
                  <div className="space-y-3.5 flex-1">
                    {statusSummary.map((item) => (
                      <div key={item.status} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-heading-charcoal">
                          <span>{item.label}</span>
                          <span className="text-body-brown">{item.count} ({item.percentage}%)</span>
                        </div>
                        <div className="h-2 bg-stone-surface border border-stone-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-sun-yellow" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sources yield */}
                <div className="bg-white rounded-cards border border-stone-surface p-5 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Map className="w-4 h-4 text-muted-gray" />
                    <h3 className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">
                      Acquisition Channels Yield
                    </h3>
                  </div>
                  <div className="space-y-3.5 flex-1">
                    {sourceSummary.map((item) => (
                      <div key={item.source} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-heading-charcoal">
                          <span>{item.label}</span>
                          <span className="text-body-brown">{item.count} ({item.percentage}%)</span>
                        </div>
                        <div className="h-2 bg-stone-surface border border-stone-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-ember" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Exec performance table */}
              <div className="bg-white rounded-cards border border-stone-surface p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-gray" />
                    <h3 className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">
                      Sales Executive Conversion Analytics
                    </h3>
                  </div>
                </div>
                
                <DataTable
                  columns={columns}
                  data={team}
                  loading={isLoading}
                  emptyTitle="No sales representatives active"
                  emptyDescription="Stats will be displayed here when team members close deals."
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  )
}
