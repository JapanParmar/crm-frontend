'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { reportsApi } from '@/lib/api'
import { DataTable } from '@/components/ui/data-table'
import { Avatar } from '@/components/ui/avatar'
import { createColumnHelper } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Map, 
  PieChart, 
  Loader2,
  Download,
  Calendar,
  Building2,
  Clock,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react'

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
import { Doughnut, Bar, Line } from 'react-chartjs-2'

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

const employeeColumnHelper = createColumnHelper<any>()
const projectColumnHelper = createColumnHelper<any>()
const slaColumnHelper = createColumnHelper<any>()
const inventoryColumnHelper = createColumnHelper<any>()

export default function ReportsPage() {
  // Tabs: 'leads' | 'sales' | 'workforce' | 'inventory'
  const [activeTab, setActiveTab] = useState<'leads' | 'sales' | 'workforce' | 'inventory'>('leads')
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  // Queries for different tabs
  const { data: leadData, isLoading: loadingLeads } = useQuery({
    queryKey: ['reports-leads', dateFrom, dateTo],
    queryFn: () => reportsApi.leads({ start_date: dateFrom, end_date: dateTo }).then((r) => r.data.data),
    enabled: activeTab === 'leads'
  })

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['reports-sales', dateFrom, dateTo],
    queryFn: () => reportsApi.sales({ start_date: dateFrom, end_date: dateTo }).then((r) => r.data.data),
    enabled: activeTab === 'sales'
  })

  const { data: employeeData, isLoading: loadingEmployees } = useQuery({
    queryKey: ['reports-employees'],
    queryFn: () => reportsApi.employees().then((r) => r.data.data),
    enabled: activeTab === 'workforce'
  })

  const { data: slaData, isLoading: loadingSla } = useQuery({
    queryKey: ['reports-sla'],
    queryFn: () => reportsApi.sla().then((r) => r.data.data),
    enabled: activeTab === 'workforce'
  })

  const { data: inventoryData, isLoading: loadingInventory } = useQuery({
    queryKey: ['reports-inventory'],
    queryFn: () => reportsApi.inventory().then((r) => r.data.data),
    enabled: activeTab === 'inventory'
  })

  // Format currency helper
  const formatCurrency = (val?: number | null) => {
    if (!val || isNaN(val)) return '₹0'
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`
    }
    return `₹${val.toLocaleString('en-IN')}`
  }

  // General CSV Downloader
  const downloadCSV = (headers: string[], rows: any[][], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(",")].concat(rows.map(e => e.map(val => {
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`
        return val
      }).join(","))).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ---------------------------------------------------------------------------
  // TABS CONFIGURATION & DATA BUILDERS
  // ---------------------------------------------------------------------------

  // TAB 1: LEADS & CAMPAIGNS
  const leadSourceChartData = React.useMemo(() => {
    if (!leadData?.source_effectiveness) return null
    return {
      labels: leadData.source_effectiveness.map((s: any) => s.source.toUpperCase()),
      datasets: [
        {
          data: leadData.source_effectiveness.map((s: any) => s.total),
          backgroundColor: ['#2ECC71', '#3498DB', '#9B59B6', '#E67E22', '#F1C40F', '#E74C3C', '#95A5A6', '#1ABC9C'],
          borderWidth: 1,
        }
      ]
    }
  }, [leadData])

  const leadTrendChartData = React.useMemo(() => {
    if (!leadData?.daily_ingestion) return null
    return {
      labels: leadData.daily_ingestion.map((d: any) => d.date),
      datasets: [
        {
          label: 'Incoming Leads',
          data: leadData.daily_ingestion.map((d: any) => d.count),
          fill: true,
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderColor: '#3498DB',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
        }
      ]
    }
  }, [leadData])

  const exportLeadsSourceReport = () => {
    if (!leadData?.source_effectiveness) return
    const headers = ['Source', 'Total Leads', 'Won Leads', 'Lost Leads', 'Conversion Rate (%)']
    const rows = leadData.source_effectiveness.map((item: any) => [
      item.source,
      item.total,
      item.won,
      item.lost,
      item.conversion_rate
    ])
    downloadCSV(headers, rows, 'lead_sources_report')
  }

  // TAB 2: SALES & PROJECTS REVENUE
  const revenueChartData = React.useMemo(() => {
    if (!salesData?.revenue_by_project) return null
    return {
      labels: salesData.revenue_by_project.map((p: any) => p.name),
      datasets: [
        {
          label: 'Estimated Bookings Revenue (₹)',
          data: salesData.revenue_by_project.map((p: any) => p.estimated_revenue),
          backgroundColor: 'rgba(46, 204, 113, 0.85)',
          borderColor: '#2ECC71',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    }
  }, [salesData])

  const exportSalesReport = () => {
    if (!salesData?.revenue_by_project) return
    const headers = ['Project Name', 'Won Deals Count', 'Estimated Revenue (INR)']
    const rows = salesData.revenue_by_project.map((item: any) => [
      item.name,
      item.won_leads_count,
      item.estimated_revenue
    ])
    downloadCSV(headers, rows, 'sales_revenue_report')
  }

  // TAB 3: WORKFORCE & SLA
  const workforceColumns = React.useMemo(() => [
    employeeColumnHelper.accessor('name', {
      header: 'Sales Representative',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.original.name} size="xs" />
          <div>
            <p className="font-extrabold text-heading-charcoal">{row.original.name}</p>
            <span className="block text-[10px] text-muted-gray">{row.original.designation}</span>
          </div>
        </div>
      )
    }),
    employeeColumnHelper.accessor('assigned_leads', {
      header: 'Assigned Leads',
      cell: (info) => <span className="font-semibold text-body-brown">{info.getValue()}</span>
    }),
    employeeColumnHelper.accessor('won_leads', {
      header: 'Deals Won',
      cell: (info) => <span className="font-bold text-grass-green">{info.getValue()}</span>
    }),
    employeeColumnHelper.accessor('conversion_rate', {
      header: 'Conversion Rate',
      cell: (info) => (
        <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
          {info.getValue()}%
        </span>
      )
    }),
    employeeColumnHelper.accessor('site_visits_scheduled', {
      header: 'Visits Scheduled',
      cell: (info) => <span className="text-body-brown">{info.getValue()}</span>
    }),
    employeeColumnHelper.accessor('site_visit_conversion_rate', {
      header: 'Visits Conv. %',
      cell: (info) => <span className="font-semibold text-heading-charcoal">{info.getValue()}%</span>
    })
  ], [])

  const slaColumns = React.useMemo(() => [
    slaColumnHelper.accessor('name', {
      header: 'Employee',
      cell: (info) => <span className="font-bold text-heading-charcoal">{info.getValue()}</span>
    }),
    slaColumnHelper.accessor('total_assigned', {
      header: 'Total Routed',
      cell: (info) => <span className="font-medium text-body-brown">{info.getValue()}</span>
    }),
    slaColumnHelper.accessor('accepted_count', {
      header: 'Accepted',
      cell: (info) => <span className="font-bold text-grass-green">{info.getValue()}</span>
    }),
    slaColumnHelper.accessor('rejected_count', {
      header: 'Rejected',
      cell: (info) => <span className="font-bold text-alert-red">{info.getValue()}</span>
    }),
    slaColumnHelper.accessor('expired_count', {
      header: 'SLA Breached',
      cell: (info) => <span className="font-bold text-amber-700">{info.getValue()}</span>
    }),
    slaColumnHelper.accessor('sla_breach_rate', {
      header: 'Breach Rate',
      cell: (info) => {
        const val = info.getValue()
        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
            val > 20 
              ? 'bg-red-50 text-red-700 border-red-200' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {val}%
          </span>
        )
      }
    }),
    slaColumnHelper.accessor('avg_acceptance_time_mins', {
      header: 'Avg Response Time',
      cell: (info) => <span className="font-bold text-heading-charcoal">{info.getValue()} mins</span>
    })
  ], [])

  const exportWorkforceReport = () => {
    if (!employeeData) return
    const headers = ['Representative', 'Designation', 'Assigned Leads', 'Won Leads', 'Conversion Rate (%)', 'Site Visits Scheduled', 'Visits Completed', 'Visit Conv. Rate (%)']
    const rows = employeeData.map((item: any) => [
      item.name,
      item.designation,
      item.assigned_leads,
      item.won_leads,
      item.conversion_rate,
      item.site_visits_scheduled,
      item.site_visits_completed,
      item.site_visit_conversion_rate
    ])
    downloadCSV(headers, rows, 'employee_performance_report')
  }

  const exportSlaReport = () => {
    if (!slaData) return
    const headers = ['Employee', 'Total Assignments', 'Accepted', 'Rejected', 'SLA Expired', 'Breach Rate (%)', 'Avg Response Time (mins)']
    const rows = slaData.map((item: any) => [
      item.name,
      item.total_assigned,
      item.accepted_count,
      item.rejected_count,
      item.expired_count,
      item.sla_breach_rate,
      item.avg_acceptance_time_mins
    ])
    downloadCSV(headers, rows, 'sla_adherence_report')
  }

  // TAB 4: INVENTORY & PROJECTS
  const inventoryChartData = React.useMemo(() => {
    if (!inventoryData?.summary) return null
    return {
      labels: ['Units Sold', 'Units Available'],
      datasets: [
        {
          data: [inventoryData.summary.sold_units, inventoryData.summary.available_units],
          backgroundColor: ['#2ECC71', '#F1C40F'],
          borderWidth: 1,
        }
      ]
    }
  }, [inventoryData])

  const inventoryColumns = React.useMemo(() => [
    inventoryColumnHelper.accessor('name', {
      header: 'Project Name',
      cell: (info) => <span className="font-bold text-heading-charcoal">{info.getValue()}</span>
    }),
    inventoryColumnHelper.accessor('total_units', {
      header: 'Total Inventory',
      cell: (info) => <span className="font-medium text-body-brown">{info.getValue()}</span>
    }),
    inventoryColumnHelper.accessor('available_units', {
      header: 'Available Units',
      cell: (info) => <span className="font-bold text-sun-yellow">{info.getValue()}</span>
    }),
    inventoryColumnHelper.accessor('sold_units', {
      header: 'Sold Units',
      cell: (info) => <span className="font-bold text-grass-green">{info.getValue()}</span>
    }),
    inventoryColumnHelper.accessor('sold_units', {
      id: 'occupancy_rate',
      header: 'Occupancy Rate',
      cell: ({ row }) => {
        const total = row.original.total_units
        const sold = row.original.sold_units
        const rate = total > 0 ? Math.round((sold / total) * 100) : 0
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-stone-surface rounded-full h-1.5 overflow-hidden">
              <div className="bg-grass-green h-full" style={{ width: `${rate}%` }} />
            </div>
            <span className="text-[10px] font-bold text-heading-charcoal">{rate}%</span>
          </div>
        )
      }
    })
  ], [])

  const exportInventoryReport = () => {
    if (!inventoryData?.projects) return
    const headers = ['Project Name', 'Total Units', 'Available Units', 'Sold Units']
    const rows = inventoryData.projects.map((item: any) => [
      item.name,
      item.total_units,
      item.available_units,
      item.sold_units
    ])
    downloadCSV(headers, rows, 'inventory_distribution_report')
  }

  const tabs = [
    { label: 'Leads & Campaigns', value: 'leads' },
    { label: 'Sales & Revenue', value: 'sales' },
    { label: 'Workforce & SLA', value: 'workforce' },
    { label: 'Inventory & Projects', value: 'inventory' },
  ]

  const isTabLoading = 
    (activeTab === 'leads' && loadingLeads) ||
    (activeTab === 'sales' && loadingSales) ||
    (activeTab === 'workforce' && (loadingEmployees || loadingSla)) ||
    (activeTab === 'inventory' && loadingInventory)

  return (
    <AppShell>
      <AppHeader title="CRM Analytics Dashboard" subtitle="Enterprise telemetry suite & performance insights." />

      <main className="flex flex-col h-full bg-cream-canvas" style={{ paddingTop: '56px' }}>
        <PageHeader
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t as any)}
          actions={
            <div className="flex items-center gap-2">
              {activeTab === 'leads' && (
                <div className="flex items-center gap-1 bg-white border border-stone-border rounded-lg h-9 px-2">
                  <span className="text-[10px] uppercase font-bold text-muted-gray">From:</span>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent border-none text-xs focus:outline-none" />
                  <span className="text-[10px] uppercase font-bold text-muted-gray ml-2">To:</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent border-none text-xs focus:outline-none" />
                </div>
              )}
              {activeTab === 'sales' && (
                <div className="flex items-center gap-1 bg-white border border-stone-border rounded-lg h-9 px-2">
                  <span className="text-[10px] uppercase font-bold text-muted-gray">From:</span>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent border-none text-xs focus:outline-none" />
                  <span className="text-[10px] uppercase font-bold text-muted-gray ml-2">To:</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent border-none text-xs focus:outline-none" />
                </div>
              )}
              
              <Button 
                onClick={
                  activeTab === 'leads' ? exportLeadsSourceReport :
                  activeTab === 'sales' ? exportSalesReport :
                  activeTab === 'workforce' ? exportWorkforceReport :
                  exportInventoryReport
                } 
                size="sm" 
                variant="primary" 
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Export Report
              </Button>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto px-4 md:px-5 py-5 max-w-6xl w-full mx-auto space-y-6">
          {isTabLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
          ) : (
            <>
              {/* TAB 1: LEADS & CAMPAIGNS VIEW */}
              {activeTab === 'leads' && leadData && (
                <div className="space-y-6">
                  {/* Lead stats cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-cards p-6 border border-stone-surface">
                      <p className="text-muted-gray text-xs font-semibold uppercase tracking-wider">Total Leads Analyzed</p>
                      <h2 className="text-3xl font-extrabold text-heading-charcoal mt-2">
                        {leadData.source_effectiveness?.reduce((acc: number, cur: any) => acc + cur.total, 0) || 0}
                      </h2>
                    </div>
                    <div className="bg-white rounded-cards p-6 border border-stone-surface">
                      <p className="text-muted-gray text-xs font-semibold uppercase tracking-wider">Overall Qualified Deals</p>
                      <h2 className="text-3xl font-extrabold text-grass-green mt-2">
                        {leadData.source_effectiveness?.reduce((acc: number, cur: any) => acc + cur.won, 0) || 0}
                      </h2>
                    </div>
                    <div className="bg-white rounded-cards p-6 border border-stone-surface">
                      <p className="text-muted-gray text-xs font-semibold uppercase tracking-wider">Average Channels Yield</p>
                      <h2 className="text-3xl font-extrabold text-brand mt-2">
                        {leadData.source_effectiveness?.length > 0 
                          ? (leadData.source_effectiveness.reduce((acc: number, cur: any) => acc + cur.conversion_rate, 0) / leadData.source_effectiveness.length).toFixed(1)
                          : 0}%
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Daily ingestion trend */}
                    <div className="bg-white rounded-cards border border-stone-surface p-5 flex flex-col h-[350px]">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-brand" />
                        <h3 className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">Daily Ingestion Rate</h3>
                      </div>
                      <div className="relative flex-1">
                        {leadTrendChartData ? (
                          <Line 
                            data={leadTrendChartData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } },
                              scales: {
                                x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                                y: { grid: { display: true }, ticks: { font: { size: 9 } } }
                              }
                            }} 
                          />
                        ) : <p className="text-xs text-muted-gray">No trend data available.</p>}
                      </div>
                    </div>

                    {/* Source yield */}
                    <div className="bg-white rounded-cards border border-stone-surface p-5 flex flex-col h-[350px]">
                      <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-4 h-4 text-brand" />
                        <h3 className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">Conversion by Lead Provider</h3>
                      </div>
                      <div className="relative flex-1 flex justify-center">
                        {leadSourceChartData ? (
                          <Doughnut 
                            data={leadSourceChartData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'right',
                                  labels: { font: { size: 9, weight: 'bold' } }
                                }
                              }
                            }} 
                          />
                        ) : <p className="text-xs text-muted-gray">No source data available.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SALES & REVENUE VIEW */}
              {activeTab === 'sales' && salesData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-cards p-6 border border-stone-surface flex items-center justify-between">
                      <div>
                        <p className="text-muted-gray text-xs font-semibold uppercase tracking-wider">Total Sales Pipeline Value</p>
                        <h2 className="text-3xl font-extrabold text-heading-charcoal mt-2">
                          {formatCurrency(salesData.revenue_by_project?.reduce((acc: number, cur: any) => acc + cur.estimated_revenue, 0) || 0)}
                        </h2>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-full text-grass-green">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white rounded-cards p-6 border border-stone-surface flex items-center justify-between">
                      <div>
                        <p className="text-muted-gray text-xs font-semibold uppercase tracking-wider">Average Deal Cycle Time</p>
                        <h2 className="text-3xl font-extrabold text-heading-charcoal mt-2">
                          {salesData.avg_cycle_days} Days
                        </h2>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-full text-amber-700">
                        <Clock className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-cards border border-stone-surface p-5 flex flex-col h-[400px]">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-4 h-4 text-brand" />
                      <h3 className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">Revenue Breakdown by Project</h3>
                    </div>
                    <div className="relative flex-1">
                      {revenueChartData ? (
                        <Bar 
                          data={revenueChartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } },
                              y: { ticks: { font: { size: 9 } } }
                            }
                          }} 
                        />
                      ) : <p className="text-xs text-muted-gray">No revenue data available.</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WORKFORCE & SLA VIEW */}
              {activeTab === 'workforce' && (
                <div className="space-y-8">
                  {/* Sales performance table */}
                  <div className="bg-white rounded-cards border border-stone-surface p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-brand" />
                        <h3 className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">Sales Representative Conversion Analytics</h3>
                      </div>
                    </div>
                    <DataTable 
                      columns={workforceColumns} 
                      data={employeeData || []} 
                      loading={loadingEmployees} 
                      emptyTitle="No staff statistics found."
                    />
                  </div>

                  {/* SLA Adherence Table */}
                  <div className="bg-white rounded-cards border border-stone-surface p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-brand" />
                        <h3 className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">Lead SLA Routing Adherence</h3>
                      </div>
                      <Button onClick={exportSlaReport} size="xs" variant="outline">Export SLA Logs</Button>
                    </div>
                    <DataTable 
                      columns={slaColumns} 
                      data={slaData || []} 
                      loading={loadingSla} 
                      emptyTitle="No SLA data found."
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: INVENTORY & PROJECTS VIEW */}
              {activeTab === 'inventory' && inventoryData && (
                <div className="space-y-6">
                  {/* Summary row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-cards p-6 border border-stone-surface">
                      <p className="text-muted-gray text-xs font-semibold uppercase tracking-wider">Total Units</p>
                      <h2 className="text-2xl font-extrabold text-heading-charcoal mt-2">{inventoryData.summary.total_units}</h2>
                    </div>
                    <div className="bg-white rounded-cards p-6 border border-stone-surface">
                      <p className="text-muted-gray text-xs font-semibold uppercase tracking-wider">Available Units</p>
                      <h2 className="text-2xl font-extrabold text-sun-yellow mt-2">{inventoryData.summary.available_units}</h2>
                    </div>
                    <div className="bg-white rounded-cards p-6 border border-stone-surface">
                      <p className="text-muted-gray text-xs font-semibold uppercase tracking-wider">Sold Units</p>
                      <h2 className="text-2xl font-extrabold text-grass-green mt-2">{inventoryData.summary.sold_units}</h2>
                    </div>
                    <div className="bg-white rounded-cards p-6 border border-stone-surface">
                      <p className="text-muted-gray text-xs font-semibold uppercase tracking-wider">Total Sales Value</p>
                      <h2 className="text-2xl font-extrabold text-brand mt-2">{formatCurrency(inventoryData.summary.total_sales_value)}</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Share donut */}
                    <div className="bg-white rounded-cards border border-stone-surface p-5 flex flex-col h-[320px]">
                      <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-4 h-4 text-brand" />
                        <h3 className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">Inventory Share</h3>
                      </div>
                      <div className="relative flex-1 flex justify-center">
                        {inventoryChartData ? (
                          <Doughnut 
                            data={inventoryChartData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                  labels: { font: { size: 9, weight: 'bold' } }
                                }
                              }
                            }} 
                          />
                        ) : <p className="text-xs text-muted-gray">No inventory chart data.</p>}
                      </div>
                    </div>

                    {/* Breakdown table */}
                    <div className="bg-white rounded-cards border border-stone-surface p-5 md:col-span-2 space-y-4 flex flex-col h-[320px] overflow-hidden">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand" />
                        <h3 className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">Project-wise Units Breakdown</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        <DataTable 
                          columns={inventoryColumns} 
                          data={inventoryData.projects || []} 
                          loading={false} 
                          emptyTitle="No project breakdown found."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </AppShell>
  )
}
