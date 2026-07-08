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

// Chart.js imports and configuration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

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

  // Chart.js data for status pipeline doughnut chart
  const pipelineChartData = React.useMemo(() => {
    return {
      labels: statusSummary.map(item => item.label),
      datasets: [
        {
          data: statusSummary.map(item => item.count),
          backgroundColor: [
            '#F1C40F', // New / Yellow
            '#3498DB', // Contacted / Blue
            '#E67E22', // Qualified / Orange
            '#9B59B6', // Proposal / Purple
            '#2ECC71', // Closed Won / Green
            '#E74C3C', // Closed Lost / Red
            '#95A5A6'  // Cold / Gray
          ],
          borderWidth: 2,
          borderColor: '#FFF',
        }
      ]
    }
  }, [statusSummary])

  const pipelineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 8,
          font: { size: 9, weight: 'bold' as const },
          color: '#5C5246',
        }
      },
      tooltip: {
        backgroundColor: '#1E1E1E',
        bodyFont: { size: 10 },
        padding: 8,
        borderRadius: 6,
      }
    },
    cutout: '60%',
  }

  // Chart.js data for channels horizontal bar chart
  const acquisitionChartData = React.useMemo(() => {
    return {
      labels: sourceSummary.map(item => item.label),
      datasets: [
        {
          label: 'Leads',
          data: sourceSummary.map(item => item.count),
          backgroundColor: 'rgba(230, 126, 34, 0.75)',
          borderColor: '#E67E22',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    }
  }, [sourceSummary])

  const acquisitionChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E1E1E',
        bodyFont: { size: 10 },
        padding: 8,
        borderRadius: 6,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8A8A8A', font: { size: 8, weight: 'bold' as const } }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#8A8A8A', font: { size: 9, weight: 'bold' as const } }
      }
    }
  }

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

        <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-4 md:space-y-6 max-w-6xl mx-auto w-full">
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
                  <div className="h-[225px] relative flex-1 mt-2">
                    {statusSummary.length === 0 ? (
                      <p className="text-xs text-muted-gray py-2 text-center">No stage data yet</p>
                    ) : (
                      <Doughnut data={pipelineChartData} options={pipelineChartOptions} />
                    )}
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
                  <div className="h-[225px] relative flex-1 mt-2">
                    {sourceSummary.length === 0 ? (
                      <p className="text-xs text-muted-gray py-2 text-center">No source data yet</p>
                    ) : (
                      <Bar data={acquisitionChartData} options={acquisitionChartOptions} />
                    )}
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
