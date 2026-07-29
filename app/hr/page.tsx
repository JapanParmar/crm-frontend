'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import {
  UserCheck,
  Search,
  Users,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Edit2,
  Trash2,
  Eye,
  X,
  UserPlus,
  BadgeCheck,
  Clock,
  LogOut,
  LogIn,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  Check,
  Send,
  Building2,
  ShieldCheck,
  Sparkles,
  Upload,
  Loader2,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader, PageHeader } from '@/components/layout/AppHeader'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { useToastStore } from '@/store/useToastStore'
import { useAuthStore } from '@/store/useAuthStore'
import {
  employeesApi,
  hrmApi,
  ApiHREmployee,
  HREmployeeStats,
  CreateHREmployeePayload,
  ApiAttendance,
  ApiLeave,
  ApiPayroll,
} from '@/lib/api'

const attendanceColumnHelper = createColumnHelper<ApiAttendance>()
const payrollColumnHelper = createColumnHelper<ApiPayroll>()

export default function HRPage() {
  const { addToast } = useToastStore()
  const currentUser = useAuthStore((s) => s.user)

  // Role authorization
  const isAdminOrHr = Boolean(
    currentUser?.roles?.some((r) => ['admin', 'superadmin', 'hr'].includes(r.toLowerCase()))
  )

  // Main HRM Tabs: 'directory' | 'attendance' | 'leaves' | 'payroll'
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'leaves' | 'payroll'>('directory')

  // ---------------------------------------------------------------------------
  // DIRECTORY STATE
  // ---------------------------------------------------------------------------
  const [employees, setEmployees] = useState<ApiHREmployee[]>([])
  const [stats, setStats] = useState<HREmployeeStats | null>(null)
  const [loadingEmp, setLoadingEmp] = useState(true)
  const [empSearch, setEmpSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [empStatusFilter, setEmpStatusFilter] = useState('all')
  const [empTypeFilter, setEmpTypeFilter] = useState('all')
  const [empPage, setEmpPage] = useState(1)
  const [empTotalPages, setEmpTotalPages] = useState(1)

  // Directory Modals
  const [isCreateEmpOpen, setIsCreateEmpOpen] = useState(false)
  const [isEditEmpOpen, setIsEditEmpOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<ApiHREmployee | null>(null)
  const [detailEmp, setDetailEmp] = useState<ApiHREmployee | null>(null)

  const [empFormData, setEmpFormData] = useState<CreateHREmployeePayload>({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: 'Sales',
    designation: 'Sales Executive',
    employment_type: 'full_time',
    status: 'active',
    joining_date: '',
    salary: undefined,
    pan_number: '',
    aadhar_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    notes: '',
  })
  const [submittingEmp, setSubmittingEmp] = useState(false)
  const [uploadingEmpImage, setUploadingEmpImage] = useState(false)

  // ---------------------------------------------------------------------------
  // ATTENDANCE STATE
  // ---------------------------------------------------------------------------
  const [todayAttendance, setTodayAttendance] = useState<ApiAttendance | null>(null)
  const [hasEmpProfile, setHasEmpProfile] = useState<boolean>(true)
  const [myEmpRecord, setMyEmpRecord] = useState<ApiHREmployee | null>(null)
  const [attendances, setAttendances] = useState<ApiAttendance[]>([])
  const [loadingAtt, setLoadingAtt] = useState(false)
  const [attStatusFilter, setAttStatusFilter] = useState('all')
  const [attDateFilter, setAttDateFilter] = useState('')

  // ---------------------------------------------------------------------------
  // LEAVE MANAGEMENT STATE
  // ---------------------------------------------------------------------------
  const [leaves, setLeaves] = useState<ApiLeave[]>([])
  const [loadingLeaves, setLoadingLeaves] = useState(false)
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('all')
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false)
  const [leaveFormData, setLeaveFormData] = useState({
    leave_type: 'casual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
  })
  const [submittingLeave, setSubmittingLeave] = useState(false)
  const [reviewLeave, setReviewLeave] = useState<ApiLeave | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  // ---------------------------------------------------------------------------
  // PAYROLL STATE
  // ---------------------------------------------------------------------------
  const [payrolls, setPayrolls] = useState<ApiPayroll[]>([])
  const [loadingPayroll, setLoadingPayroll] = useState(false)
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1)
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear())
  const [processingBatch, setProcessingBatch] = useState(false)
  const [detailPayslip, setDetailPayslip] = useState<ApiPayroll | null>(null)

  // ---------------------------------------------------------------------------
  // FETCHERS
  // ---------------------------------------------------------------------------
  const fetchEmployees = async () => {
    try {
      setLoadingEmp(true)
      const res = await employeesApi.list({
        search: empSearch || undefined,
        department: deptFilter !== 'all' ? deptFilter : undefined,
        status: empStatusFilter !== 'all' ? empStatusFilter : undefined,
        employment_type: empTypeFilter !== 'all' ? empTypeFilter : undefined,
        page: empPage,
        limit: 12,
      })
      if (res.data?.success) {
        setEmployees(res.data.data)
        setEmpTotalPages(res.data.meta?.total_pages || 1)
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to load employee directory.', 'error')
    } finally {
      setLoadingEmp(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await employeesApi.stats()
      if (res.data?.success) {
        setStats(res.data.data)
      }
    } catch {
      // quiet
    }
  }

  const fetchTodayAttendance = async () => {
    try {
      const res = await hrmApi.todayAttendance()
      if (res.data?.success) {
        setTodayAttendance(res.data.data.attendance)
        setHasEmpProfile(res.data.data.has_employee_profile)
        if (res.data.data.employee) {
          setMyEmpRecord(res.data.data.employee)
        }
      }
    } catch {
      // quiet
    }
  }

  const fetchAttendances = async () => {
    try {
      setLoadingAtt(true)
      const res = await hrmApi.attendances({
        status: attStatusFilter !== 'all' ? attStatusFilter : undefined,
        date: attDateFilter || undefined,
        limit: 25,
      })
      if (res.data?.success) {
        setAttendances(res.data.data)
      }
    } catch (err: any) {
      addToast('Failed to load attendance records.', 'error')
    } finally {
      setLoadingAtt(false)
    }
  }

  const fetchLeaves = async () => {
    try {
      setLoadingLeaves(true)
      const res = await hrmApi.leaves({
        status: leaveStatusFilter !== 'all' ? leaveStatusFilter : undefined,
        limit: 25,
      })
      if (res.data?.success) {
        setLeaves(res.data.data)
      }
    } catch {
      addToast('Failed to load leave applications.', 'error')
    } finally {
      setLoadingLeaves(false)
    }
  }

  const fetchPayrolls = async () => {
    try {
      setLoadingPayroll(true)
      const res = await hrmApi.payrolls({
        month: payrollMonth,
        year: payrollYear,
        limit: 25,
      })
      if (res.data?.success) {
        setPayrolls(res.data.data)
      }
    } catch {
      addToast('Failed to load payroll details.', 'error')
    } finally {
      setLoadingPayroll(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchTodayAttendance()
  }, [])

  useEffect(() => {
    if (activeTab === 'directory') fetchEmployees()
    if (activeTab === 'attendance') fetchAttendances()
    if (activeTab === 'leaves') fetchLeaves()
    if (activeTab === 'payroll') fetchPayrolls()
  }, [activeTab, empSearch, deptFilter, empStatusFilter, empTypeFilter, empPage, attStatusFilter, attDateFilter, leaveStatusFilter, payrollMonth, payrollYear])

  // Formatting utilities
  const formatCurrency = (val?: number | null) => {
    if (!val || isNaN(val)) return '₹0'
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`
    }
    return `₹${val.toLocaleString('en-IN')}`
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <StatusBadge label="Active" bg="rgba(46, 204, 113, 0.08)" text="var(--color-grass-green)" border="rgba(46, 204, 113, 0.2)" dot />
      case 'on_leave':
        return <StatusBadge label="On Leave" bg="rgba(52, 152, 219, 0.08)" text="var(--color-sky-blue)" border="rgba(52, 152, 219, 0.2)" dot />
      case 'suspended':
        return <StatusBadge label="Suspended" bg="rgba(231, 76, 60, 0.08)" text="var(--color-alert-red)" border="rgba(231, 76, 60, 0.2)" dot />
      case 'terminated':
        return <StatusBadge label="Terminated" bg="var(--color-stone-surface)" text="var(--color-muted-gray)" border="var(--color-stone-border)" dot />
      default:
        return <StatusBadge label={status} bg="var(--color-stone-surface)" text="var(--color-body-brown)" />
    }
  }

  // Clock In / Clock Out Handlers
  const handleClockIn = async () => {
    try {
      const res = await hrmApi.clockIn('Clocked in from Web App')
      if (res.data?.success) {
        addToast('Clocked in successfully!', 'success')
        fetchTodayAttendance()
        if (activeTab === 'attendance') fetchAttendances()
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to clock in.', 'error')
    }
  }

  const handleClockOut = async () => {
    try {
      const res = await hrmApi.clockOut()
      if (res.data?.success) {
        addToast('Clocked out successfully!', 'success')
        fetchTodayAttendance()
        if (activeTab === 'attendance') fetchAttendances()
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to clock out.', 'error')
    }
  }

  // Employee Directory Handlers
  const handleOpenCreateEmp = () => {
    setEmpFormData({
      employee_code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: 'Sales',
      designation: 'Sales Executive',
      employment_type: 'full_time',
      status: 'active',
      joining_date: new Date().toISOString().split('T')[0],
      salary: 60000,
      pan_number: '',
      aadhar_number: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      address: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      notes: '',
    })
    setIsCreateEmpOpen(true)
  }

  const handleOpenEditEmp = (emp: ApiHREmployee) => {
    setSelectedEmp(emp)
    setEmpFormData({
      employee_code: emp.employee_code,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      employment_type: emp.employment_type,
      status: emp.status,
      joining_date: emp.joining_date,
      salary: emp.salary || undefined,
      pan_number: emp.pan_number || '',
      aadhar_number: emp.aadhar_number || '',
      emergency_contact_name: emp.emergency_contact_name || '',
      emergency_contact_phone: emp.emergency_contact_phone || '',
      address: emp.address || '',
      bank_name: emp.bank_name || '',
      account_number: emp.account_number || '',
      ifsc_code: emp.ifsc_code || '',
      notes: emp.notes || '',
      user_id: emp.user_id || undefined,
    })
    setIsEditEmpOpen(true)
  }

  const handleSubmitEmp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmittingEmp(true)
      if (isEditEmpOpen && selectedEmp) {
        await employeesApi.update(selectedEmp.id, empFormData)
        addToast('Employee profile updated.', 'success')
        setIsEditEmpOpen(false)
      } else {
        await employeesApi.create(empFormData)
        addToast('Employee created successfully.', 'success')
        setIsCreateEmpOpen(false)
      }
      fetchEmployees()
      fetchStats()
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Action failed.', 'error')
    } finally {
      setSubmittingEmp(false)
    }
  }

  const handleDeleteEmp = async (emp: ApiHREmployee) => {
    if (!confirm(`Delete employee record for ${emp.first_name} ${emp.last_name}?`)) return
    try {
      await employeesApi.delete(emp.id)
      addToast('Employee record deleted.', 'success')
      fetchEmployees()
      fetchStats()
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete employee.', 'error')
    }
  }

  // Leave Handlers
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leaveFormData.reason.trim()) {
      addToast('Please provide a reason for the leave.', 'error')
      return
    }
    try {
      setSubmittingLeave(true)
      await hrmApi.applyLeave(leaveFormData)
      addToast('Leave application submitted successfully.', 'success')
      setIsApplyLeaveOpen(false)
      fetchLeaves()
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to submit leave application.', 'error')
    } finally {
      setSubmittingLeave(false)
    }
  }

  const handleUpdateLeaveStatus = async (status: 'approved' | 'rejected') => {
    if (!reviewLeave) return
    try {
      await hrmApi.updateLeaveStatus(reviewLeave.id, { status, admin_notes: adminNotes })
      addToast(`Leave request ${status}.`, 'success')
      setReviewLeave(null)
      setAdminNotes('')
      fetchLeaves()
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update leave status.', 'error')
    }
  }

  // Batch Payroll Processing Handler
  const handleProcessPayroll = async () => {
    try {
      setProcessingBatch(true)
      const res = await hrmApi.processPayroll({ month: payrollMonth, year: payrollYear })
      if (res.data?.success) {
        addToast(res.data.message || 'Monthly payroll generated for active staff.', 'success')
        fetchPayrolls()
        fetchStats()
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to process batch payroll.', 'error')
    } finally {
      setProcessingBatch(false)
    }
  }

  const tabs = [
    { label: isAdminOrHr ? 'Workforce Directory' : 'Company Directory', value: 'directory', count: stats?.all },
    { label: isAdminOrHr ? 'Daily Attendance' : 'My Attendance Log', value: 'attendance' },
    { label: isAdminOrHr ? 'Leave Requests' : 'My Leave Applications', value: 'leaves' },
    { label: isAdminOrHr ? 'Payroll & Payslips' : 'My Payslips', value: 'payroll' },
  ]

  // Columns definition for TanStack Attendance Table
  const attendanceColumns = useMemo(() => [
    attendanceColumnHelper.accessor('employee', {
      header: 'Employee',
      cell: ({ row }) => {
        const att = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar name={att.employee ? `${att.employee.first_name} ${att.employee.last_name}` : 'Staff'} src={att.employee?.profile_image || undefined} size="xs" />
            <div>
              <p className="font-extrabold text-heading-charcoal">
                {att.employee ? `${att.employee.first_name} ${att.employee.last_name}` : `Emp #${att.employee_id}`}
              </p>
              <span className="block text-[10px] text-muted-gray">{att.employee?.employee_code || ''}</span>
            </div>
          </div>
        )
      }
    }),
    attendanceColumnHelper.accessor('date', {
      header: 'Date',
      cell: (info) => <span className="text-body-brown font-medium">{info.getValue()}</span>
    }),
    attendanceColumnHelper.accessor('clock_in', {
      header: 'Clock In',
      cell: (info) => <span className="font-bold text-grass-green">{info.getValue() || '--:--'}</span>
    }),
    attendanceColumnHelper.accessor('clock_out', {
      header: 'Clock Out',
      cell: (info) => <span className="font-bold text-amber-700">{info.getValue() || '--:--'}</span>
    }),
    attendanceColumnHelper.accessor('work_hours', {
      header: 'Work Hours',
      cell: (info) => <span className="font-bold text-heading-charcoal">{info.getValue()} hrs</span>
    }),
    attendanceColumnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const val = info.getValue()
        return (
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-badges border ${
              val === 'present'
                ? 'bg-emerald-100/40 text-emerald-800 border-emerald-200'
                : val === 'late'
                ? 'bg-amber-100/40 text-amber-800 border-amber-200'
                : 'bg-red-100/40 text-red-800 border-red-200'
            }`}
          >
            {val}
          </span>
        )
      }
    })
  ], [])

  // Columns definition for TanStack Payroll Table
  const payrollColumns = useMemo(() => [
    payrollColumnHelper.accessor('employee', {
      header: 'Employee',
      cell: ({ row }) => {
        const pr = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar name={pr.employee ? `${pr.employee.first_name} ${pr.employee.last_name}` : 'Staff'} src={pr.employee?.profile_image || undefined} size="xs" />
            <div>
              <p className="font-extrabold text-heading-charcoal">
                {pr.employee ? `${pr.employee.first_name} ${pr.employee.last_name}` : `Emp #${pr.employee_id}`}
              </p>
              <span className="block text-[10px] text-muted-gray">{pr.employee?.designation || ''}</span>
            </div>
          </div>
        )
      }
    }),
    payrollColumnHelper.accessor('month', {
      header: 'Period',
      cell: ({ row }) => {
        const pr = row.original
        return <span className="font-bold text-heading-charcoal">{pr.month}/{pr.year}</span>
      }
    }),
    payrollColumnHelper.accessor('basic_salary', {
      header: 'Basic Salary',
      cell: (info) => <span className="font-medium text-body-brown">{formatCurrency(info.getValue())}</span>
    }),
    payrollColumnHelper.accessor('allowances', {
      header: 'Allowances',
      cell: ({ row }) => {
        const pr = row.original
        return <span className="text-grass-green font-semibold">+{formatCurrency(pr.hra + pr.allowances)}</span>
      }
    }),
    payrollColumnHelper.accessor('deductions', {
      header: 'Deductions',
      cell: (info) => <span className="text-alert-red font-semibold">-{formatCurrency(info.getValue())}</span>
    }),
    payrollColumnHelper.accessor('net_salary', {
      header: 'Net Payout',
      cell: (info) => <span className="font-extrabold text-heading-charcoal text-sm">{formatCurrency(info.getValue())}</span>
    }),
    payrollColumnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <span className="text-[10px] font-bold uppercase bg-emerald-100/40 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-badges">
          {info.getValue()}
        </span>
      )
    }),
    payrollColumnHelper.display({
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        const pr = row.original
        return (
          <button
            onClick={() => setDetailPayslip(pr)}
            className="p-1.5 rounded-buttons hover:bg-stone-surface text-body-brown hover:text-heading-charcoal border border-transparent transition-colors"
            title="View Breakdown"
          >
            <Eye className="w-4 h-4" />
          </button>
        )
      }
    })
  ], [])

  return (
    <AppShell>
      <AppHeader title="HRM Portal" subtitle="Manage organizational directory, attendance, leaves, and payroll." />

      <main className="flex flex-col h-full bg-cream-canvas relative" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10 flex-shrink-0">
          <PageHeader
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(t) => setActiveTab(t as any)}
            actions={
              <div className="flex items-center gap-2">
                {activeTab === 'directory' && isAdminOrHr && (
                  <Button onClick={handleOpenCreateEmp} size="sm" variant="primary" icon={<UserPlus className="w-3.5 h-3.5" />}>
                    Add Employee
                  </Button>
                )}
                {activeTab === 'leaves' && (
                  <Button onClick={() => setIsApplyLeaveOpen(true)} size="sm" variant="primary" icon={<Send className="w-3.5 h-3.5" />}>
                    Apply Leave
                  </Button>
                )}
                {activeTab === 'payroll' && isAdminOrHr && (
                  <Button onClick={handleProcessPayroll} disabled={processingBatch} size="sm" variant="primary" icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
                    {processingBatch ? 'Processing...' : 'Run Payroll'}
                  </Button>
                )}
              </div>
            }
          />

          {/* Sticky Filters Toolbar depending on activeTab */}
          <div className="flex items-center gap-2 px-3 md:px-4 py-2.5 overflow-x-auto scrollbar-none border-t border-stone-surface bg-[#fcfbf9]">
            {activeTab === 'directory' && (
              <>
                <div className="relative flex-shrink-0 w-[180px] sm:w-[200px] sm:flex-1 sm:max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-gray" />
                  <input
                    type="search"
                    placeholder="Search name, code, role..."
                    value={empSearch}
                    onChange={(e) => {
                      setEmpSearch(e.target.value)
                      setEmpPage(1)
                    }}
                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-stone-border bg-white text-xs focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black"
                  />
                </div>

                <select
                  value={deptFilter}
                  onChange={(e) => {
                    setDeptFilter(e.target.value)
                    setEmpPage(1)
                  }}
                  className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer flex-shrink-0"
                >
                  <option value="all">All Departments</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Construction">Construction</option>
                </select>

                <select
                  value={empStatusFilter}
                  onChange={(e) => {
                    setEmpStatusFilter(e.target.value)
                    setEmpPage(1)
                  }}
                  className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer flex-shrink-0"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
                </select>
              </>
            )}

            {activeTab === 'attendance' && (
              <>
                <div className="flex items-center gap-1.5 bg-white border border-stone-border rounded-lg h-9 px-2.5 flex-shrink-0">
                  <span className="text-[10px] uppercase font-bold text-muted-gray">Date:</span>
                  <input
                    type="date"
                    value={attDateFilter}
                    onChange={(e) => setAttDateFilter(e.target.value)}
                    className="bg-transparent border-none text-xs text-body-brown focus:outline-none cursor-pointer"
                  />
                </div>

                <select
                  value={attStatusFilter}
                  onChange={(e) => setAttStatusFilter(e.target.value)}
                  className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer flex-shrink-0"
                >
                  <option value="all">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="absent">Absent</option>
                </select>

                <div className="flex-1" />

                <Button size="sm" variant="outline" onClick={fetchAttendances}>
                  Refresh Log
                </Button>
              </>
            )}

            {activeTab === 'leaves' && (
              <select
                value={leaveStatusFilter}
                onChange={(e) => setLeaveStatusFilter(e.target.value)}
                className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer flex-shrink-0"
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}

            {activeTab === 'payroll' && (
              <>
                <select
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(parseInt(e.target.value))}
                  className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer flex-shrink-0"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>
                      Month: {new Date(2026, m - 1, 1).toLocaleString('en-IN', { month: 'long' })}
                    </option>
                  ))}
                </select>

                <select
                  value={payrollYear}
                  onChange={(e) => setPayrollYear(parseInt(e.target.value))}
                  className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer flex-shrink-0"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* View Mode Router */}
        {(activeTab === 'directory' || activeTab === 'leaves') ? (
          /* Scrollable Page for Directory / Leaves grids including Stats Cards */
          <div className="flex-1 overflow-y-auto px-4 md:px-5 py-5 max-w-6xl w-full mx-auto space-y-6">
            {/* Global Key Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-cards p-6 border border-stone-surface hover:border-stone-border transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-gray text-xs font-semibold uppercase tracking-wider">
                  <span>Total Staff</span>
                  <Users className="w-4 h-4 text-brand" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-heading-charcoal">{stats?.all ?? 0}</span>
                  <span className="text-[10px] font-bold text-grass-green bg-emerald-50 px-2 py-0.5 rounded-badges">
                    Active: {stats?.active ?? 0}
                  </span>
                </div>
              </div>

              {/* Today's Punch Widget */}
              <div className="bg-white rounded-cards p-6 border border-stone-surface hover:border-stone-border transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-gray text-xs font-semibold uppercase tracking-wider">
                  <span>My Shift ({currentUser?.name?.split(' ')[0]})</span>
                  <Clock className="w-4 h-4 text-brand" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  {todayAttendance?.clock_in ? (
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-grass-green block truncate">
                        In: {todayAttendance.clock_in}
                      </span>
                      <span className="text-[10px] text-muted-gray block truncate">
                        {todayAttendance.clock_out ? `Out: ${todayAttendance.clock_out}` : `Hours: ${todayAttendance.work_hours}h`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-alert-red">Not Clocked In</span>
                  )}

                  {!todayAttendance?.clock_in ? (
                    <Button size="xs" variant="primary" onClick={handleClockIn} className="h-7 px-2.5 gap-1 text-[11px]">
                      <LogIn className="w-3 h-3" /> Punch In
                    </Button>
                  ) : !todayAttendance.clock_out ? (
                    <Button size="xs" variant="secondary" onClick={handleClockOut} className="h-7 px-2.5 gap-1 text-[11px] bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900">
                      <LogOut className="w-3 h-3" /> Punch Out
                    </Button>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-badges">Done</span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-cards p-6 border border-stone-surface hover:border-stone-border transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-gray text-xs font-semibold uppercase tracking-wider">
                  <span>Staff On Leave</span>
                  <AlertCircle className="w-4 h-4 text-brand" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-heading-charcoal">{stats?.on_leave ?? 0}</span>
                  <span className="text-[10px] font-bold text-brand bg-slate-alias/10 px-2 py-0.5 rounded-badges">
                    Today
                  </span>
                </div>
              </div>

              {isAdminOrHr ? (
                <div className="bg-white rounded-cards p-6 border border-stone-surface hover:border-stone-border transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-gray text-xs font-semibold uppercase tracking-wider">
                    <span>Monthly Payroll</span>
                    <IndianRupee className="w-4 h-4 text-brand" />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-heading-charcoal">{formatCurrency(stats?.total_payroll)}</span>
                    <span className="text-[10px] font-bold text-grass-green bg-emerald-50 px-2 py-0.5 rounded-badges">
                      Direct
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-cards p-6 border border-stone-surface hover:border-stone-border transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-gray text-xs font-semibold uppercase tracking-wider">
                    <span>My Monthly Salary</span>
                    <IndianRupee className="w-4 h-4 text-brand" />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-heading-charcoal">
                      {myEmpRecord?.salary ? formatCurrency(myEmpRecord.salary) : 'N/A'}
                    </span>
                    <span className="text-[10px] font-bold text-grass-green bg-emerald-50 px-2 py-0.5 rounded-badges">
                      Base
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Content Switcher for Directory / Leaves */}
            {activeTab === 'directory' ? (
              loadingEmp ? (
                <div className="py-20 text-center text-muted-gray text-sm font-medium">Loading employee directory...</div>
              ) : employees.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-stone-border rounded-cards bg-white">
                  <UserCheck className="w-10 h-10 mx-auto text-muted-gray mb-3" />
                  <h3 className="text-base font-bold text-heading-charcoal">No employees found</h3>
                  <p className="text-xs text-body-brown mt-1 max-w-sm mx-auto">
                    No staff records match your current filters. Add a new employee or clear filters.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {employees.map((emp) => (
                      <div
                        key={emp.id}
                        className="bg-white border border-stone-surface hover:border-stone-border transition-all rounded-cards p-6 flex flex-col justify-between shadow-sm hover:shadow-md"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={`${emp.first_name} ${emp.last_name}`} src={emp.profile_image || undefined} size="md" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-extrabold bg-stone-surface text-body-brown px-1.5 py-0.5 rounded-badges border border-stone-border">
                                    {emp.employee_code}
                                  </span>
                                  <span className="text-[10px] uppercase font-bold text-muted-gray">
                                    {emp.employment_type.replace('_', ' ')}
                                  </span>
                                </div>
                                <h3 className="text-sm font-extrabold text-heading-charcoal mt-1 leading-snug">
                                  {emp.first_name} {emp.last_name}
                                </h3>
                              </div>
                            </div>
                            {renderStatusBadge(emp.status)}
                          </div>

                          <div className="bg-[#fcfbf9] border border-stone-surface rounded-xl p-3 mb-4 space-y-1">
                            <p className="text-xs font-bold text-heading-charcoal flex items-center justify-between">
                              <span>{emp.designation}</span>
                              <span className="text-[10px] font-bold text-body-brown bg-white border border-stone-border px-2 py-0.5 rounded-pills">
                                {emp.department}
                              </span>
                            </p>
                          </div>

                          <div className="space-y-2 text-xs text-body-brown mb-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-muted-gray flex-shrink-0" />
                              <span className="truncate">{emp.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-muted-gray flex-shrink-0" />
                              <span>{emp.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-stone-surface flex items-center justify-between text-xs">
                          <span className="font-extrabold text-heading-charcoal">
                            {isAdminOrHr || emp.email === currentUser?.email || emp.user_id === currentUser?.id
                              ? `${formatCurrency(emp.salary)}/mo`
                              : ''}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setDetailEmp(emp)}
                              className="p-1.5 rounded-buttons hover:bg-stone-surface text-body-brown hover:text-heading-charcoal transition-colors border border-transparent"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isAdminOrHr && (
                              <>
                                <button
                                  onClick={() => handleOpenEditEmp(emp)}
                                  className="p-1.5 rounded-buttons hover:bg-stone-surface text-body-brown hover:text-heading-charcoal transition-colors border border-transparent"
                                  title="Edit Record"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEmp(emp)}
                                  className="p-1.5 rounded-buttons hover:bg-red-50 text-alert-red transition-colors"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Directory Pagination */}
                  {empTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 pb-6">
                      <span className="text-xs text-body-brown">
                        Page <span className="font-bold text-heading-charcoal">{empPage}</span> of {empTotalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" disabled={empPage === 1} onClick={() => setEmpPage((p) => Math.max(1, p - 1))}>
                          Previous
                        </Button>
                        <Button size="sm" variant="outline" disabled={empPage === empTotalPages} onClick={() => setEmpPage((p) => Math.min(empTotalPages, p + 1))}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )
            ) : (
              /* Leaves applications list */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {loadingLeaves ? (
                  <div className="col-span-full py-16 text-center text-muted-gray text-xs font-semibold">
                    Loading leave applications...
                  </div>
                ) : leaves.length === 0 ? (
                  <div className="col-span-full py-16 text-center border border-stone-border rounded-cards bg-white text-muted-gray text-xs font-semibold">
                    No leave requests found.
                  </div>
                ) : (
                  leaves.map((lv) => (
                    <div key={lv.id} className="bg-white border border-stone-surface hover:border-stone-border transition-all rounded-cards p-6 space-y-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-heading-charcoal text-sm leading-snug">
                            {lv.employee ? `${lv.employee.first_name} ${lv.employee.last_name}` : 'Staff Member'}
                          </h4>
                          <span className="text-[10px] uppercase font-bold text-muted-gray block mt-0.5">{lv.leave_type} Leave</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-badges border ${
                            lv.status === 'approved'
                              ? 'bg-emerald-100/40 text-emerald-800 border-emerald-200'
                              : lv.status === 'rejected'
                              ? 'bg-red-100/40 text-red-800 border-red-200'
                              : 'bg-amber-100/40 text-amber-800 border-amber-200'
                          }`}
                        >
                          {lv.status}
                        </span>
                      </div>

                      <div className="p-3 bg-[#fcfbf9] border border-stone-surface rounded-xl text-xs space-y-1.5">
                        <div className="flex justify-between text-body-brown font-semibold">
                          <span>Duration:</span>
                          <span className="text-heading-charcoal font-bold">{lv.days_count} Days</span>
                        </div>
                        <div className="flex justify-between text-body-brown">
                          <span>Dates:</span>
                          <span className="font-medium">{lv.start_date} to {lv.end_date}</span>
                        </div>
                      </div>

                      <p className="text-xs text-body-brown italic bg-stone-surface/40 p-2.5 rounded-xl border border-stone-border/30">
                        "{lv.reason}"
                      </p>

                      {isAdminOrHr && lv.status === 'pending' && (
                        <div className="pt-1">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setReviewLeave(lv)}
                            className="w-full text-xs h-8 gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Review Application
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          /* Full Page Tabular Spreadsheet View matching Leads table */
          <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
            {activeTab === 'attendance' ? (
              <DataTable
                columns={attendanceColumns}
                data={attendances}
                loading={loadingAtt}
                getRowId={(row) => row.id.toString()}
                emptyTitle="No attendance records found"
                emptyDescription="Try adjusting your filters or dates."
              />
            ) : (
              <DataTable
                columns={payrollColumns}
                data={payrolls}
                loading={loadingPayroll}
                getRowId={(row) => row.id.toString()}
                onRowClick={(pr) => setDetailPayslip(pr)}
                emptyTitle="No payroll records found"
                emptyDescription="Run payroll or adjust month/year to see results."
              />
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* MODALS */}
        {/* =================================================================== */}

        {/* Modal: Create / Edit Employee */}
        <Modal
          open={isCreateEmpOpen || isEditEmpOpen}
          onClose={() => {
            setIsCreateEmpOpen(false)
            setIsEditEmpOpen(false)
          }}
          title={isEditEmpOpen ? 'Edit Employee Profile' : 'Add New Staff Member'}
          description="Enter credentials, job designations, salary structures, and banking information."
          size="lg"
        >
          <form onSubmit={handleSubmitEmp} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Employee Code"
                required
                placeholder="e.g. EMP-101"
                value={empFormData.employee_code}
                onChange={(e) => setEmpFormData({ ...empFormData, employee_code: e.target.value })}
              />

              <Input
                label="Joining Date"
                type="date"
                required
                value={empFormData.joining_date}
                onChange={(e) => setEmpFormData({ ...empFormData, joining_date: e.target.value })}
              />

              <Input
                label="First Name"
                required
                placeholder="Arjun"
                value={empFormData.first_name}
                onChange={(e) => setEmpFormData({ ...empFormData, first_name: e.target.value })}
              />

              <Input
                label="Last Name"
                required
                placeholder="Rathore"
                value={empFormData.last_name}
                onChange={(e) => setEmpFormData({ ...empFormData, last_name: e.target.value })}
              />

              <Input
                label="Email"
                type="email"
                required
                placeholder="arjun@company.com"
                value={empFormData.email}
                onChange={(e) => setEmpFormData({ ...empFormData, email: e.target.value })}
              />

              <Input
                label="Phone"
                required
                placeholder="9876543210"
                value={empFormData.phone}
                onChange={(e) => setEmpFormData({ ...empFormData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Department"
                value={empFormData.department}
                onChange={(e) => setEmpFormData({ ...empFormData, department: e.target.value })}
                options={[
                  { value: 'Sales', label: 'Sales' },
                  { value: 'Marketing', label: 'Marketing' },
                  { value: 'HR', label: 'HR' },
                  { value: 'IT', label: 'IT' },
                  { value: 'Finance', label: 'Finance' },
                  { value: 'Operations', label: 'Operations' },
                  { value: 'Construction', label: 'Construction' },
                ]}
              />

              <Input
                label="Designation"
                required
                placeholder="Senior Advisor"
                value={empFormData.designation}
                onChange={(e) => setEmpFormData({ ...empFormData, designation: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Employment Type"
                value={empFormData.employment_type}
                onChange={(e) => setEmpFormData({ ...empFormData, employment_type: e.target.value })}
                options={[
                  { value: 'full_time', label: 'Full Time' },
                  { value: 'part_time', label: 'Part Time' },
                  { value: 'contract', label: 'Contract' },
                  { value: 'intern', label: 'Intern' },
                  { value: 'probation', label: 'Probation' },
                ]}
              />

              <Select
                label="Status"
                value={empFormData.status}
                onChange={(e) => setEmpFormData({ ...empFormData, status: e.target.value })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'on_leave', label: 'On Leave' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'terminated', label: 'Terminated' },
                ]}
              />
            </div>

            <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 space-y-4">
              <span className="text-xs font-bold text-heading-charcoal block border-b border-stone-border pb-1.5">Compensation & Statutory IDs</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Monthly Base Salary (₹)"
                  type="number"
                  placeholder="e.g. 75000"
                  value={empFormData.salary || ''}
                  onChange={(e) => setEmpFormData({ ...empFormData, salary: parseFloat(e.target.value) || undefined })}
                />
                <Input
                  label="PAN Card Number"
                  placeholder="ABCDE1234F"
                  value={empFormData.pan_number || ''}
                  onChange={(e) => setEmpFormData({ ...empFormData, pan_number: e.target.value })}
                />
                <Input
                  label="Aadhaar Number"
                  placeholder="1234 5678 9012"
                  value={empFormData.aadhar_number || ''}
                  onChange={(e) => setEmpFormData({ ...empFormData, aadhar_number: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 space-y-4">
              <span className="text-xs font-bold text-heading-charcoal block border-b border-stone-border pb-1.5">Bank Account Details</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Bank Name"
                  placeholder="HDFC Bank"
                  value={empFormData.bank_name || ''}
                  onChange={(e) => setEmpFormData({ ...empFormData, bank_name: e.target.value })}
                />
                <Input
                  label="Account Number"
                  placeholder="5010023456789"
                  value={empFormData.account_number || ''}
                  onChange={(e) => setEmpFormData({ ...empFormData, account_number: e.target.value })}
                />
                <Input
                  label="IFSC Code"
                  placeholder="HDFC0001234"
                  value={empFormData.ifsc_code || ''}
                  onChange={(e) => setEmpFormData({ ...empFormData, ifsc_code: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Emergency Contact Name"
                placeholder="Emergency Contact"
                value={empFormData.emergency_contact_name || ''}
                onChange={(e) => setEmpFormData({ ...empFormData, emergency_contact_name: e.target.value })}
              />

              <Input
                label="Emergency Phone"
                placeholder="Emergency Phone"
                value={empFormData.emergency_contact_phone || ''}
                onChange={(e) => setEmpFormData({ ...empFormData, emergency_contact_phone: e.target.value })}
              />
            </div>

            <Textarea
              label="Residential Address"
              placeholder="Enter full address..."
              value={empFormData.address || ''}
              onChange={(e) => setEmpFormData({ ...empFormData, address: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-surface">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreateEmpOpen(false)
                  setIsEditEmpOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingEmp}>
                {submittingEmp ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Apply Leave */}
        <Modal
          open={isApplyLeaveOpen}
          onClose={() => setIsApplyLeaveOpen(false)}
          title="Apply for Leave"
          description="Submit a leave application for HR manager review."
          size="md"
        >
          <form onSubmit={handleApplyLeave} className="space-y-4">
            <Select
              label="Leave Type"
              value={leaveFormData.leave_type}
              onChange={(e) => setLeaveFormData({ ...leaveFormData, leave_type: e.target.value })}
              options={[
                { value: 'casual', label: 'Casual Leave' },
                { value: 'sick', label: 'Sick Leave' },
                { value: 'earned', label: 'Earned / Privilege Leave' },
                { value: 'unpaid', label: 'Unpaid Leave' },
              ]}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                required
                value={leaveFormData.start_date}
                onChange={(e) => setLeaveFormData({ ...leaveFormData, start_date: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                required
                value={leaveFormData.end_date}
                onChange={(e) => setLeaveFormData({ ...leaveFormData, end_date: e.target.value })}
              />
            </div>

            <Textarea
              label="Reason for Leave"
              required
              placeholder="Explain the reason for request..."
              value={leaveFormData.reason}
              onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-surface">
              <Button type="button" variant="secondary" onClick={() => setIsApplyLeaveOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingLeave}>
                {submittingLeave ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Review Leave Application (Admin) */}
        <Modal
          open={!!reviewLeave}
          onClose={() => setReviewLeave(null)}
          title="Review Leave Application"
          description="Evaluate employee leave requests and approve/reject."
          size="md"
        >
          {reviewLeave && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 space-y-2">
                <p className="text-sm font-extrabold text-heading-charcoal">
                  {reviewLeave.employee ? `${reviewLeave.employee.first_name} ${reviewLeave.employee.last_name}` : 'Staff Member'}
                </p>
                <p className="text-body-brown font-medium">Type: <span className="font-bold text-heading-charcoal">{reviewLeave.leave_type} Leave</span></p>
                <p className="text-body-brown font-medium">Dates: <span className="font-bold text-heading-charcoal">{reviewLeave.start_date} to {reviewLeave.end_date} ({reviewLeave.days_count} days)</span></p>
                <p className="italic text-body-brown bg-white border border-stone-border p-2.5 rounded-xl mt-2 font-medium">
                  "{reviewLeave.reason}"
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-heading-charcoal mb-1">Admin Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Enter approval/rejection remarks..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-3 rounded-inputs border border-stone-border bg-white text-xs outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-surface">
                <Button variant="danger" onClick={() => handleUpdateLeaveStatus('rejected')}>
                  Reject Request
                </Button>
                <Button variant="primary" onClick={() => handleUpdateLeaveStatus('approved')} className="bg-emerald-700 hover:bg-emerald-800">
                  Approve Leave
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: Payslip Breakdown Viewer */}
        <Modal
          open={!!detailPayslip}
          onClose={() => setDetailPayslip(null)}
          title="Payslip Breakdown"
          description={`Period: ${detailPayslip?.month}/${detailPayslip?.year}`}
          size="md"
        >
          {detailPayslip && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4">
                <span className="text-muted-gray text-[9px] uppercase font-bold block">Employee</span>
                <p className="font-extrabold text-heading-charcoal text-sm">
                  {detailPayslip.employee ? `${detailPayslip.employee.first_name} ${detailPayslip.employee.last_name}` : 'Staff Member'}
                </p>
                <span className="text-[11px] text-body-brown font-medium mt-0.5 block">{detailPayslip.employee?.designation}</span>
              </div>

              <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Basic Salary:</span>
                  <span className="font-bold text-heading-charcoal">{formatCurrency(detailPayslip.basic_salary)}</span>
                </div>
                <div className="flex justify-between text-grass-green font-medium">
                  <span>House Rent Allowance (HRA):</span>
                  <span>+{formatCurrency(detailPayslip.hra)}</span>
                </div>
                <div className="flex justify-between text-grass-green font-medium">
                  <span>Special Allowances:</span>
                  <span>+{formatCurrency(detailPayslip.allowances)}</span>
                </div>
                <div className="flex justify-between text-alert-red font-medium border-t border-stone-border pt-1.5">
                  <span>Deductions (TDS / PF):</span>
                  <span>-{formatCurrency(detailPayslip.deductions)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-heading-charcoal text-sm border-t border-stone-border pt-2">
                  <span>Net Disbursed Payout:</span>
                  <span>{formatCurrency(detailPayslip.net_salary)}</span>
                </div>
              </div>

              <div className="p-3 bg-stone-surface rounded-xl text-[11px] text-body-brown flex justify-between border border-stone-border">
                <span>Method: {detailPayslip.payment_method || 'Bank Direct Deposit'}</span>
                <span className="font-extrabold text-grass-green uppercase">{detailPayslip.status}</span>
              </div>

              <div className="flex justify-end pt-3">
                <Button variant="secondary" onClick={() => setDetailPayslip(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: View Employee Details Drawer */}
        <Modal
          open={!!detailEmp}
          onClose={() => setDetailEmp(null)}
          title="Employee HR Profile"
          description={`${detailEmp?.first_name} ${detailEmp?.last_name}`}
          size="md"
        >
          {detailEmp && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col items-center justify-center gap-2 border-b border-stone-border pb-4">
                <div className="relative group w-20 h-20 rounded-full overflow-hidden border border-stone-border bg-stone-surface flex items-center justify-center shadow-inner">
                  <Avatar
                    name={`${detailEmp.first_name} ${detailEmp.last_name}`}
                    src={detailEmp.profile_image || undefined}
                    size="lg"
                    className="w-full h-full text-base"
                  />
                  {uploadingEmpImage && (
                    <div className="absolute inset-0 bg-ink-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                {isAdminOrHr && (
                  <label className="flex items-center gap-1 cursor-pointer bg-stone-surface hover:bg-stone-border border border-stone-border text-heading-charcoal text-[10px] font-bold px-2.5 py-1 rounded transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>Upload photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (!e.target.files || e.target.files.length === 0) return
                        const file = e.target.files[0]
                        try {
                          setUploadingEmpImage(true)
                          const res = await employeesApi.uploadImage(detailEmp.id, file)
                          if (res.data?.success) {
                            addToast('Employee profile picture updated successfully.', 'success')
                            setDetailEmp(res.data.data)
                            fetchEmployees()
                          }
                        } catch (err: any) {
                          addToast(err.response?.data?.message || 'Failed to upload photo.', 'error')
                        } finally {
                          setUploadingEmpImage(false)
                        }
                      }}
                      disabled={uploadingEmpImage}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 grid grid-cols-2 gap-3.5">
                <div><span className="text-muted-gray text-[9px] uppercase font-bold">Emp Code</span><p className="font-bold text-heading-charcoal mt-0.5">{detailEmp.employee_code}</p></div>
                <div><span className="text-muted-gray text-[9px] uppercase font-bold">Type</span><p className="font-bold text-heading-charcoal mt-0.5 capitalize">{detailEmp.employment_type.replace('_', ' ')}</p></div>
                <div><span className="text-muted-gray text-[9px] uppercase font-bold">Joined</span><p className="font-bold text-heading-charcoal mt-0.5">{detailEmp.joining_date}</p></div>
                {(isAdminOrHr || detailEmp.email === currentUser?.email || detailEmp.user_id === currentUser?.id) && (
                  <div><span className="text-muted-gray text-[9px] uppercase font-bold">Salary</span><p className="font-bold text-heading-charcoal mt-0.5">{formatCurrency(detailEmp.salary)}/mo</p></div>
                )}
              </div>

              <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 space-y-2">
                <span className="text-muted-gray text-[9px] uppercase font-bold block border-b border-stone-border pb-1">Contact Information</span>
                <p className="font-medium"><span className="text-body-brown font-semibold">Email:</span> {detailEmp.email}</p>
                <p className="font-medium"><span className="text-body-brown font-semibold">Phone:</span> {detailEmp.phone}</p>
                {detailEmp.address && <p className="font-medium"><span className="text-body-brown font-semibold">Address:</span> {detailEmp.address}</p>}
              </div>

              {(isAdminOrHr || detailEmp.email === currentUser?.email || detailEmp.user_id === currentUser?.id) && (detailEmp.bank_name || detailEmp.account_number) && (
                <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 space-y-2">
                  <span className="text-muted-gray text-[9px] uppercase font-bold block border-b border-stone-border pb-1">Bank Details</span>
                  <p className="font-medium"><span className="text-body-brown font-semibold">Bank:</span> {detailEmp.bank_name || 'N/A'}</p>
                  <p className="font-medium"><span className="text-body-brown font-semibold">Account #:</span> {detailEmp.account_number || 'N/A'}</p>
                  <p className="font-medium"><span className="text-body-brown font-semibold">IFSC:</span> {detailEmp.ifsc_code || 'N/A'}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </main>
    </AppShell>
  )
}
