'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import {
  BookOpen, Plus, Search, Eye, Edit2, X,
  IndianRupee, Calendar, Phone, User, Loader2, RefreshCw,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader, PageHeader } from '@/components/layout/AppHeader'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToastStore } from '@/store/useToastStore'
import {
  inventoryApi, ApiBooking, ApiPayment, projectsApi, ApiProject,
  leadsApi, ApiLead, usersApi, ApiEmployee, ApiUnit, ApiTower
} from '@/lib/api'

const columnHelper = createColumnHelper<ApiBooking>()

const AGR_COLORS: Record<string, string> = { draft: '#f59e0b', signed: '#3b82f6', registered: '#22c55e' }
const PAY_STATUS_COLORS: Record<string, string> = { pending: '#f59e0b', paid: '#22c55e', overdue: '#ef4444' }

function fmt(n?: number | null) {
  if (n == null) return '—'
  return '₹' + new Intl.NumberFormat('en-IN').format(n)
}

export default function BookingsPage() {
  const { addToast } = useToastStore()

  const [bookings, setBookings] = useState<ApiBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [agreementFilter, setAgreementFilter] = useState('')

  // Detail view states
  const [viewBooking, setViewBooking] = useState<ApiBooking | null>(null)
  const [payments, setPayments] = useState<ApiPayment[]>([])
  const [paymentSummary, setPaymentSummary] = useState<{ total_due: number; total_paid: number; pending: number; overdue: number } | null>(null)
  const [loadingPayments, setLoadingPayments] = useState(false)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState<Partial<ApiPayment>>({ payment_type: 'installment', payment_status: 'pending' })

  // New Booking states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectsList, setProjectsList] = useState<ApiProject[]>([])
  const [towersList, setTowersList] = useState<ApiTower[]>([])
  const [unitsList, setUnitsList] = useState<ApiUnit[]>([])
  const [leadsList, setLeadsList] = useState<ApiLead[]>([])
  const [employeesList, setEmployeesList] = useState<ApiEmployee[]>([])
  const [savingBooking, setSavingBooking] = useState(false)
  const [bookingForm, setBookingForm] = useState<{
    project_id?: string
    tower_id?: string
    unit_id?: string
    lead_id?: string
    customer_name: string
    customer_phone: string
    customer_email: string
    booking_date: string
    booking_amount: string
    agreement_status: 'draft' | 'signed' | 'registered'
    notes: string
    assigned_to?: string
  }>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    booking_date: new Date().toISOString().split('T')[0],
    booking_amount: '',
    agreement_status: 'draft',
    notes: '',
  })

  // ── view booking → load payments ───────────────────────────────────────────
  const openBooking = useCallback(async (b: ApiBooking) => {
    setViewBooking(b)
    setLoadingPayments(true)
    setPayments([])
    try {
      const r = await inventoryApi.getPayments(b.id)
      setPayments(r.data.data)
      setPaymentSummary(r.data.summary)
    } catch {} finally { setLoadingPayments(false) }
  }, [])

  // ── load bookings ──────────────────────────────────────────────────────────
  const loadBookings = useCallback(() => {
    setLoading(true)
    inventoryApi.getBookings({ search: search || undefined, agreement_status: agreementFilter || undefined })
      .then(r => setBookings(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, agreementFilter])

  useEffect(() => { loadBookings() }, [loadBookings])

  const columns = useMemo(() => [
    columnHelper.accessor('customer_name', {
      header: 'Customer',
      cell: info => <span className="font-bold text-heading-charcoal">{info.getValue()}</span>
    }),
    columnHelper.accessor('customer_phone', {
      header: 'Phone',
      cell: info => <span className="text-body-brown">{info.getValue()}</span>
    }),
    columnHelper.accessor('unit', {
      header: 'Unit',
      cell: info => {
        const u = info.getValue()
        if (!u) return '—'
        return (
          <span style={{ background: '#eef2ff', color: '#6366f1', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
            {u.unit_number} · {u.bhk_type}
          </span>
        )
      }
    }),
    columnHelper.accessor(row => (row.unit as any)?.tower?.project?.name, {
      id: 'project',
      header: 'Project',
      cell: info => <span className="text-body-brown">{info.getValue() || '—'}</span>
    }),
    columnHelper.accessor('booking_date', {
      header: 'Booking Date',
      cell: info => <span className="text-muted-gray">{info.getValue()}</span>
    }),
    columnHelper.accessor('booking_amount', {
      header: 'Amount',
      cell: info => <span className="font-bold text-heading-charcoal">{fmt(info.getValue())}</span>
    }),
    columnHelper.accessor('agreement_status', {
      header: 'Agreement',
      cell: info => {
        const status = info.getValue()
        return (
          <span style={{ background: (AGR_COLORS[status] ?? '#9ca3af') + '22', color: AGR_COLORS[status] ?? '#9ca3af', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
            {status}
          </span>
        )
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <button
          id={`view-booking-${info.row.original.id}`}
          onClick={(e) => {
            e.stopPropagation()
            openBooking(info.row.original)
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
        >
          <Eye style={{ width: 13, height: 13 }} /> View
        </button>
      )
    })
  ], [openBooking])

  // ── add payment ────────────────────────────────────────────────────────────
  const savePayment = async () => {
    if (!viewBooking) return
    try {
      await inventoryApi.createPayment(viewBooking.id, paymentForm)
      addToast('Payment record added.', 'success')
      setShowPaymentModal(false)
      openBooking(viewBooking)
    } catch {}
  }

  // ── mark paid ──────────────────────────────────────────────────────────────
  const markPaid = async (p: ApiPayment) => {
    try {
      await inventoryApi.updatePayment(p.id, { payment_status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
      addToast('Marked as paid.', 'success')
      if (viewBooking) openBooking(viewBooking)
    } catch {}
  }

  // ── open new booking modal ──────────────────────────────────────────────────
  const openNewBooking = async () => {
    setTowersList([])
    setUnitsList([])
    setBookingForm({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      booking_date: new Date().toISOString().split('T')[0],
      booking_amount: '',
      agreement_status: 'draft',
      notes: '',
    })

    try {
      const pRes = await projectsApi.list({ limit: 100 })
      setProjectsList(pRes.data.data)
    } catch {}

    try {
      const lRes = await leadsApi.list({ limit: 200 })
      setLeadsList(lRes.data.data)
    } catch {}

    try {
      const eRes = await usersApi.employees()
      setEmployeesList(eRes.data.data)
    } catch {}

    setShowCreateModal(true)
  }

  // ── handle project selection ────────────────────────────────────────────────
  const handleProjectChange = async (projIdStr: string) => {
    const projId = projIdStr ? Number(projIdStr) : undefined
    setBookingForm(f => ({ ...f, project_id: projIdStr, tower_id: '', unit_id: '' }))
    setTowersList([])
    setUnitsList([])
    if (!projId) return
    try {
      const r = await inventoryApi.getTowers(projId)
      setTowersList(r.data.data)
    } catch {}
  }

  // ── handle tower selection ──────────────────────────────────────────────────
  const handleTowerChange = async (towIdStr: string) => {
    const towId = towIdStr ? Number(towIdStr) : undefined
    setBookingForm(f => ({ ...f, tower_id: towIdStr, unit_id: '' }))
    setUnitsList([])
    if (!towId) return
    try {
      const r = await inventoryApi.getUnits(towId)
      setUnitsList(r.data.data.filter(u => ['available', 'reserved', 'hold'].includes(u.status)))
    } catch {}
  }

  // ── handle lead selection ───────────────────────────────────────────────────
  const handleLeadChange = (ldIdStr: string) => {
    const ldId = ldIdStr ? Number(ldIdStr) : undefined
    const selectedLead = leadsList.find(l => l.id === ldId)
    if (selectedLead) {
      setBookingForm(f => ({
        ...f,
        lead_id: ldIdStr,
        customer_name: selectedLead.name,
        customer_phone: selectedLead.phone,
        customer_email: selectedLead.email ?? '',
      }))
    } else {
      setBookingForm(f => ({ ...f, lead_id: ldIdStr }))
    }
  }

  // ── submit booking ──────────────────────────────────────────────────────────
  const handleCreateBooking = async () => {
    if (!bookingForm.unit_id) {
      addToast('Please select a unit to book.', 'error')
      return
    }
    if (!bookingForm.customer_name) {
      addToast('Please enter customer name.', 'error')
      return
    }
    if (!bookingForm.customer_phone) {
      addToast('Please enter customer phone number.', 'error')
      return
    }
    if (!bookingForm.booking_amount || Number(bookingForm.booking_amount) <= 0) {
      addToast('Please enter a valid booking amount.', 'error')
      return
    }

    setSavingBooking(true)
    try {
      const payload = {
        unit_id: Number(bookingForm.unit_id),
        lead_id: bookingForm.lead_id ? Number(bookingForm.lead_id) : undefined,
        customer_name: bookingForm.customer_name,
        customer_phone: bookingForm.customer_phone,
        customer_email: bookingForm.customer_email || undefined,
        assigned_to: bookingForm.assigned_to ? Number(bookingForm.assigned_to) : undefined,
        booking_date: bookingForm.booking_date,
        booking_amount: Number(bookingForm.booking_amount),
        agreement_status: bookingForm.agreement_status,
        notes: bookingForm.notes || undefined,
      }

      await inventoryApi.createBooking(payload)
      addToast('Unit booked successfully!', 'success')
      setShowCreateModal(false)
      loadBookings()
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create booking.', 'error')
    } finally {
      setSavingBooking(false)
    }
  }

  return (
    <AppShell>
      <AppHeader title="Bookings" subtitle="All unit bookings and payment tracking" />
      <main className="flex flex-col h-full bg-cream-canvas relative" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10 flex-shrink-0">
          <PageHeader
            title="Bookings Management"
            description="Track, create, and manage unit bookings and agreements."
            actions={
              <Button id="add-booking-btn" size="sm" onClick={openNewBooking}>
                <Plus className="w-3.5 h-3.5 mr-1" /> New Booking
              </Button>
            }
          />
        </div>

        <div className="px-4 md:px-5 py-5 max-w-6xl w-full mx-auto space-y-6">
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 border border-stone-surface rounded-cards shadow-sm">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-muted-gray absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="bookings-search"
                placeholder="Search by customer name or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select id="agreement-filter" value={agreementFilter} onChange={e => setAgreementFilter(e.target.value)}>
                <option value="">All Agreement Status</option>
                <option value="draft">Draft</option>
                <option value="signed">Signed</option>
                <option value="registered">Registered</option>
              </Select>
              <Button variant="outline" size="sm" onClick={loadBookings} id="refresh-bookings-btn" className="p-2">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={bookings}
            loading={loading}
            emptyTitle="No bookings found"
            emptyDescription="Try adjusting your filters or search query."
            onRowClick={(row) => openBooking(row)}
          />
        </div>

      {/* ── New Booking Modal ── */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Unit Booking" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Select
              id="booking-project"
              label="Project *"
              value={bookingForm.project_id ?? ''}
              onChange={e => handleProjectChange(e.target.value)}
            >
              <option value="">Select project...</option>
              {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>

            <Select
              id="booking-tower"
              label="Tower *"
              value={bookingForm.tower_id ?? ''}
              disabled={!bookingForm.project_id}
              onChange={e => handleTowerChange(e.target.value)}
            >
              <option value="">Select tower...</option>
              {towersList.map(t => <option key={t.id} value={t.id}>{t.tower_name}</option>)}
            </Select>

            <Select
              id="booking-unit"
              label="Unit *"
              value={bookingForm.unit_id ?? ''}
              disabled={!bookingForm.tower_id}
              onChange={e => setBookingForm(f => ({ ...f, unit_id: e.target.value }))}
            >
              <option value="">Select unit...</option>
              {unitsList.map(u => (
                <option key={u.id} value={u.id}>
                  {u.unit_number} ({u.bhk_type} · Floor {u.floor_number} · {u.status})
                </option>
              ))}
            </Select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              id="booking-lead"
              label="Link Lead (Optional)"
              value={bookingForm.lead_id ?? ''}
              onChange={e => handleLeadChange(e.target.value)}
            >
              <option value="">Select lead to link details...</option>
              {leadsList.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.phone})
                </option>
              ))}
            </Select>

            <Select
              id="booking-representative"
              label="Assigned Representative"
              value={bookingForm.assigned_to ?? ''}
              onChange={e => setBookingForm(f => ({ ...f, assigned_to: e.target.value }))}
            >
              <option value="">Select representative...</option>
              {employeesList.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </Select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input
              id="booking-customer-name"
              label="Customer Name *"
              value={bookingForm.customer_name}
              onChange={e => setBookingForm(f => ({ ...f, customer_name: e.target.value }))}
            />

            <Input
              id="booking-customer-phone"
              label="Customer Phone *"
              value={bookingForm.customer_phone}
              onChange={e => setBookingForm(f => ({ ...f, customer_phone: e.target.value }))}
            />

            <Input
              id="booking-customer-email"
              label="Customer Email"
              type="email"
              value={bookingForm.customer_email}
              onChange={e => setBookingForm(f => ({ ...f, customer_email: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input
              id="booking-amount-input"
              label="Booking Amount (₹) *"
              type="number"
              min={0}
              value={bookingForm.booking_amount}
              onChange={e => setBookingForm(f => ({ ...f, booking_amount: e.target.value }))}
            />

            <Input
              id="booking-date-input"
              label="Booking Date *"
              type="date"
              value={bookingForm.booking_date}
              onChange={e => setBookingForm(f => ({ ...f, booking_date: e.target.value }))}
            />

            <Select
              id="booking-agreement-status"
              label="Agreement Status"
              value={bookingForm.agreement_status}
              onChange={e => setBookingForm(f => ({ ...f, agreement_status: e.target.value as any }))}
            >
              <option value="draft">Draft</option>
              <option value="signed">Signed</option>
              <option value="registered">Registered</option>
            </Select>
          </div>

          <Input
            id="booking-notes-input"
            label="Notes / Special Requests"
            value={bookingForm.notes}
            onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button id="save-booking-btn" size="sm" onClick={handleCreateBooking} disabled={savingBooking}>
              {savingBooking ? 'Saving...' : 'Book Unit'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Booking Detail Modal ── */}
      <Modal open={!!viewBooking} onClose={() => setViewBooking(null)} title={`Booking — ${viewBooking?.customer_name ?? ''}`} size="lg">
        {viewBooking && (
          <div className="flex flex-col gap-4">
            {/* Customer & Unit Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Column */}
              <div className="bg-[#fcfbf9] rounded-cards p-3.5 border border-stone-surface flex flex-col gap-3">
                <span className="text-[10px] text-muted-gray uppercase font-bold tracking-wider block border-b border-stone-surface pb-1.5 mb-1.5">Customer Profile</span>
                <div><span className="text-[10px] text-body-brown font-medium">Name:</span><p className="text-xs font-bold text-heading-charcoal mt-0.5">{viewBooking.customer_name}</p></div>
                <div><span className="text-[10px] text-body-brown font-medium">Phone:</span><p className="text-xs font-bold text-heading-charcoal mt-0.5">{viewBooking.customer_phone}</p></div>
                <div><span className="text-[10px] text-body-brown font-medium">Email:</span><p className="text-xs font-bold text-heading-charcoal mt-0.5">{viewBooking.customer_email || 'N/A'}</p></div>
                {viewBooking.lead && (
                  <div className="border-t border-dashed border-stone-border/80 pt-2 mt-2"><span className="text-[10px] text-body-brown font-medium">Linked Lead:</span><p className="text-xs font-bold text-heading-charcoal mt-0.5">{viewBooking.lead.name} ({viewBooking.lead.lead_number})</p></div>
                )}
              </div>

              {/* Unit Specifications & Booking details */}
              <div className="bg-[#fcfbf9] rounded-cards p-3.5 border border-stone-surface flex flex-col gap-3">
                <span className="text-[10px] text-muted-gray uppercase font-bold tracking-wider block border-b border-stone-surface pb-1.5 mb-1.5">Unit & Booking Details</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div><span className="text-[10px] text-body-brown font-medium">Project:</span><p className="text-xs font-bold text-heading-charcoal mt-0.5">{(viewBooking.unit as any)?.tower?.project?.name || 'N/A'}</p></div>
                  <div><span className="text-[10px] text-body-brown font-medium">Tower:</span><p className="text-xs font-bold text-heading-charcoal mt-0.5">{(viewBooking.unit as any)?.tower?.tower_name || 'N/A'}</p></div>
                  <div><span className="text-[10px] text-body-brown font-medium">Unit Number:</span><p className="text-xs font-extrabold text-[#6366f1] mt-0.5">{viewBooking.unit?.unit_number || 'N/A'} ({viewBooking.unit?.bhk_type})</p></div>
                  <div><span className="text-[10px] text-body-brown font-medium">Floor:</span><p className="text-xs font-bold text-heading-charcoal mt-0.5">{viewBooking.unit?.floor_number === 0 ? 'Ground' : `Floor ${viewBooking.unit?.floor_number}`}</p></div>
                </div>
                <div className="border-t border-dashed border-stone-border/80 pt-2.5 mt-1 grid grid-cols-2 gap-2.5">
                  <div><span className="text-[10px] text-body-brown font-medium">Booking Date:</span><p className="text-xs font-bold text-heading-charcoal mt-0.5">{viewBooking.booking_date}</p></div>
                  <div><span className="text-[10px] text-body-brown font-medium">Booking Amount:</span><p className="text-xs font-bold text-heading-charcoal mt-0.5">{fmt(viewBooking.booking_amount)}</p></div>
                  <div>
                    <span className="text-[10px] text-body-brown font-medium block mb-1">Agreement:</span>
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                        viewBooking.agreement_status === 'registered' ? 'bg-grass-green/10 text-grass-green border-grass-green/20' :
                        viewBooking.agreement_status === 'signed' ? 'bg-sky-blue/10 text-sky-blue border-sky-blue/20' :
                        'bg-sun-yellow/10 text-gold border-stone-border'
                      }`}>
                        {viewBooking.agreement_status}
                      </span>
                    </div>
                  </div>
                  <div><span className="text-[10px] text-body-brown font-medium">Representative:</span><p className="text-xs font-bold text-heading-charcoal mt-0.5">{viewBooking.assignedTo?.name || 'Unassigned'}</p></div>
                </div>
              </div>
            </div>

            {/* Notes / Special Requests */}
            {viewBooking.notes && (
              <div className="bg-sun-yellow/10 border border-sun-yellow/30 rounded-cards p-3.5">
                <span className="text-[10px] text-gold uppercase font-bold tracking-wider">Notes / Special Requests</span>
                <p className="text-xs text-body-brown mt-1 leading-relaxed">{viewBooking.notes}</p>
              </div>
            )}

            {/* Payment summary */}
            {paymentSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Due', val: paymentSummary.total_due, colorClass: 'text-heading-charcoal' },
                  { label: 'Paid', val: paymentSummary.total_paid, colorClass: 'text-grass-green' },
                  { label: 'Pending', val: paymentSummary.pending, colorClass: 'text-gold' },
                  { label: 'Overdue', val: paymentSummary.overdue, colorClass: 'text-alert-red' },
                ].map(c => (
                  <div key={c.label} className="bg-[#fcfbf9] rounded-cards p-3 border border-stone-surface">
                    <div className="text-[10px] text-muted-gray uppercase font-bold tracking-wider">{c.label}</div>
                    <div className={`text-sm font-extrabold mt-1 ${c.colorClass}`}>{fmt(c.val)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Payments list */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">Payment Schedule</span>
                <Button id="add-payment-btn" size="sm" onClick={() => { setPaymentForm({ payment_type: 'installment', payment_status: 'pending' }); setShowPaymentModal(true) }}>
                  <Plus className="w-3 h-3 mr-1" /> Add Payment
                </Button>
              </div>

              {loadingPayments ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="w-5 h-5 text-brand animate-spin" />
                </div>
              ) : payments.length === 0 ? (
                <p className="text-xs text-muted-gray text-center p-4">No payments recorded</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-cards border border-stone-surface hover:bg-stone-surface/30 transition-colors duration-75">
                      <div className="flex-1">
                        <span className="text-xs font-bold text-heading-charcoal capitalize">{p.payment_type}</span>
                        {p.due_date && <span className="text-[10px] text-muted-gray ml-2 font-medium">Due: {p.due_date}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-heading-charcoal">{fmt(p.amount)}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          p.payment_status === 'paid' ? 'bg-grass-green/10 text-grass-green border-grass-green/20' :
                          p.payment_status === 'overdue' ? 'bg-alert-red/10 text-alert-red border-alert-red/20' :
                          'bg-sun-yellow/10 text-gold border-stone-border'
                        }`}>
                          {p.payment_status}
                        </span>
                        {p.payment_status !== 'paid' && (
                          <button onClick={() => markPaid(p)} className="px-2 py-0.5 rounded border border-grass-green text-grass-green bg-grass-green/5 hover:bg-grass-green/15 text-[10px] font-bold transition-colors cursor-pointer">
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add Payment Modal ── */}
      <Modal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Add Payment" size="sm">
        <div className="flex flex-col gap-3">
          <Select id="payment-type" label="Payment Type *" value={paymentForm.payment_type ?? ''} onChange={e => setPaymentForm(f => ({ ...f, payment_type: e.target.value as ApiPayment['payment_type'] }))}>
            {['booking','installment','final','registration'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </Select>
          <Input id="payment-amount" label="Amount (₹) *" type="number" min={0} value={paymentForm.amount ?? ''} onChange={e => setPaymentForm(f => ({ ...f, amount: Number(e.target.value) }))} />
          <Input id="payment-due-date" label="Due Date" type="date" value={paymentForm.due_date ?? ''} onChange={e => setPaymentForm(f => ({ ...f, due_date: e.target.value }))} />
          <Select id="payment-status" label="Status" value={paymentForm.payment_status ?? 'pending'} onChange={e => setPaymentForm(f => ({ ...f, payment_status: e.target.value as ApiPayment['payment_status'] }))}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Select>
          <Input id="payment-notes" label="Notes" value={paymentForm.notes ?? ''} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button id="save-payment-btn" size="sm" onClick={savePayment}>Save Payment</Button>
          </div>
        </div>
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </main>
  </AppShell>
)
}
