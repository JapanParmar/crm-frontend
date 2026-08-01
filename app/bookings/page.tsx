'use client'

import React, { useEffect, useState, useCallback } from 'react'
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

  // ── load bookings ──────────────────────────────────────────────────────────
  const loadBookings = useCallback(() => {
    setLoading(true)
    inventoryApi.getBookings({ search: search || undefined, agreement_status: agreementFilter || undefined })
      .then(r => setBookings(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, agreementFilter])

  useEffect(() => { loadBookings() }, [loadBookings])

  // ── view booking → load payments ───────────────────────────────────────────
  const openBooking = async (b: ApiBooking) => {
    setViewBooking(b)
    setLoadingPayments(true)
    setPayments([])
    try {
      const r = await inventoryApi.getPayments(b.id)
      setPayments(r.data.data)
      setPaymentSummary(r.data.summary)
    } catch {} finally { setLoadingPayments(false) }
  }

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
        <div style={{ padding: '24px 28px' }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              id="bookings-search"
              placeholder="Search by customer name, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>
          <Select id="agreement-filter" value={agreementFilter} onChange={e => setAgreementFilter(e.target.value)}>
            <option value="">All Agreement Status</option>
            <option value="draft">Draft</option>
            <option value="signed">Signed</option>
            <option value="registered">Registered</option>
          </Select>
          <Button variant="outline" size="sm" onClick={loadBookings} id="refresh-bookings-btn">
            <RefreshCw style={{ width: 13, height: 13 }} />
          </Button>
          <Button id="add-booking-btn" size="sm" onClick={openNewBooking}>
            <Plus style={{ width: 13, height: 13, marginRight: 4 }} /> New Booking
          </Button>
        </div>

        {/* Bookings table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader2 style={{ width: 28, height: 28, color: '#6366f1', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: 60, fontSize: 14 }}>No bookings found</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Customer', 'Phone', 'Unit', 'Project', 'Booking Date', 'Amount', 'Agreement', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1a1a1a' }}>{b.customer_name}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{b.customer_phone}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {b.unit ? (
                        <span style={{ background: '#eef2ff', color: '#6366f1', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                          {b.unit.unit_number} · {b.unit.bhk_type}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>
                      {(b.unit as any)?.tower?.project?.name ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{b.booking_date}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1a1a1a' }}>{fmt(b.booking_amount)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: (AGR_COLORS[b.agreement_status] ?? '#9ca3af') + '22', color: AGR_COLORS[b.agreement_status] ?? '#9ca3af', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                        {b.agreement_status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button id={`view-booking-${b.id}`} onClick={() => openBooking(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <Eye style={{ width: 13, height: 13 }} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Customer & Unit Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Customer Column */}
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 14, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, borderBottom: '1px solid #e5e7eb', paddingBottom: 4, marginBottom: 4 }}>Customer Profile</span>
                <div><span style={{ fontSize: 10, color: '#6b7280' }}>Name:</span><p style={{ fontSize: 13, fontWeight: 600, margin: '2px 0 0', color: '#1a1a1a' }}>{viewBooking.customer_name}</p></div>
                <div><span style={{ fontSize: 10, color: '#6b7280' }}>Phone:</span><p style={{ fontSize: 13, fontWeight: 600, margin: '2px 0 0', color: '#1a1a1a' }}>{viewBooking.customer_phone}</p></div>
                <div><span style={{ fontSize: 10, color: '#6b7280' }}>Email:</span><p style={{ fontSize: 13, fontWeight: 600, margin: '2px 0 0', color: '#1a1a1a' }}>{viewBooking.customer_email || 'N/A'}</p></div>
                {viewBooking.lead && (
                  <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 6, marginTop: 4 }}><span style={{ fontSize: 10, color: '#6b7280' }}>Linked Lead:</span><p style={{ fontSize: 12, fontWeight: 600, margin: '2px 0 0' }}>{viewBooking.lead.name} ({viewBooking.lead.lead_number})</p></div>
                )}
              </div>

              {/* Unit Specifications & Booking details */}
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 14, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, borderBottom: '1px solid #e5e7eb', paddingBottom: 4, marginBottom: 4 }}>Unit & Booking Details</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><span style={{ fontSize: 10, color: '#6b7280' }}>Project:</span><p style={{ fontSize: 12, fontWeight: 600, margin: '2px 0 0' }}>{(viewBooking.unit as any)?.tower?.project?.name || 'N/A'}</p></div>
                  <div><span style={{ fontSize: 10, color: '#6b7280' }}>Tower:</span><p style={{ fontSize: 12, fontWeight: 600, margin: '2px 0 0' }}>{(viewBooking.unit as any)?.tower?.tower_name || 'N/A'}</p></div>
                  <div><span style={{ fontSize: 10, color: '#6b7280' }}>Unit Number:</span><p style={{ fontSize: 12, fontWeight: 700, margin: '2px 0 0', color: '#6366f1' }}>{viewBooking.unit?.unit_number || 'N/A'} ({viewBooking.unit?.bhk_type})</p></div>
                  <div><span style={{ fontSize: 10, color: '#6b7280' }}>Floor:</span><p style={{ fontSize: 12, fontWeight: 600, margin: '2px 0 0' }}>{viewBooking.unit?.floor_number === 0 ? 'Ground' : `Floor ${viewBooking.unit?.floor_number}`}</p></div>
                </div>
                <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 6, marginTop: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><span style={{ fontSize: 10, color: '#6b7280' }}>Booking Date:</span><p style={{ fontSize: 12, fontWeight: 600, margin: '2px 0 0' }}>{viewBooking.booking_date}</p></div>
                  <div><span style={{ fontSize: 10, color: '#6b7280' }}>Booking Amount:</span><p style={{ fontSize: 12, fontWeight: 700, margin: '2px 0 0', color: '#1a1a1a' }}>{fmt(viewBooking.booking_amount)}</p></div>
                  <div>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>Agreement:</span>
                    <div style={{ marginTop: 2 }}>
                      <span style={{ background: (AGR_COLORS[viewBooking.agreement_status] ?? '#9ca3af') + '22', color: AGR_COLORS[viewBooking.agreement_status], borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, textTransform: 'capitalize' }}>
                        {viewBooking.agreement_status}
                      </span>
                    </div>
                  </div>
                  <div><span style={{ fontSize: 10, color: '#6b7280' }}>Representative:</span><p style={{ fontSize: 12, fontWeight: 600, margin: '2px 0 0' }}>{viewBooking.assignedTo?.name || 'Unassigned'}</p></div>
                </div>
              </div>
            </div>

            {/* Notes / Special Requests */}
            {viewBooking.notes && (
              <div style={{ background: '#fefdfc', borderRadius: 8, padding: 12, border: '1px solid #fed7aa' }}>
                <span style={{ fontSize: 10, color: '#c2410c', textTransform: 'uppercase', fontWeight: 700 }}>Notes / Special Requests</span>
                <p style={{ fontSize: 12, color: '#431407', margin: '4px 0 0', lineHeight: 1.4 }}>{viewBooking.notes}</p>
              </div>
            )}

            {/* Payment summary */}
            {paymentSummary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {[
                  { label: 'Total Due', val: paymentSummary.total_due, color: '#1a1a1a' },
                  { label: 'Paid', val: paymentSummary.total_paid, color: '#22c55e' },
                  { label: 'Pending', val: paymentSummary.pending, color: '#f59e0b' },
                  { label: 'Overdue', val: paymentSummary.overdue, color: '#ef4444' },
                ].map(c => (
                  <div key={c.label} style={{ background: '#f9fafb', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: c.color, marginTop: 2 }}>{fmt(c.val)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Payments list */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Payment Schedule</span>
                <Button id="add-payment-btn" size="sm" onClick={() => { setPaymentForm({ payment_type: 'installment', payment_status: 'pending' }); setShowPaymentModal(true) }}>
                  <Plus style={{ width: 12, height: 12, marginRight: 4 }} /> Add Payment
                </Button>
              </div>

              {loadingPayments ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                  <Loader2 style={{ width: 20, height: 20, color: '#6366f1', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : payments.length === 0 ? (
                <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: 16 }}>No payments recorded</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {payments.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{p.payment_type}</span>
                        {p.due_date && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>Due: {p.due_date}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{fmt(p.amount)}</span>
                        <span style={{ background: (PAY_STATUS_COLORS[p.payment_status] ?? '#9ca3af') + '22', color: PAY_STATUS_COLORS[p.payment_status], borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                          {p.payment_status}
                        </span>
                        {p.payment_status !== 'paid' && (
                          <button onClick={() => markPaid(p)} style={{ fontSize: 11, color: '#22c55e', background: 'none', border: '1px solid #22c55e', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
