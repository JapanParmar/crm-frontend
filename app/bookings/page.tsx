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
import { inventoryApi, ApiBooking, ApiPayment, projectsApi, ApiProject } from '@/lib/api'

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

  const [viewBooking, setViewBooking] = useState<ApiBooking | null>(null)
  const [payments, setPayments] = useState<ApiPayment[]>([])
  const [paymentSummary, setPaymentSummary] = useState<{ total_due: number; total_paid: number; pending: number; overdue: number } | null>(null)
  const [loadingPayments, setLoadingPayments] = useState(false)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState<Partial<ApiPayment>>({ payment_type: 'installment', payment_status: 'pending' })

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

  return (
    <AppShell>
      <AppHeader title="Bookings" subtitle="All unit bookings and payment tracking" />
      <div style={{ padding: '24px 28px' }}>
        <PageHeader
          title="Bookings"
          description="All unit bookings and payment tracking"
        />

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

      {/* ── Booking Detail Modal ── */}
      <Modal open={!!viewBooking} onClose={() => setViewBooking(null)} title={`Booking — ${viewBooking?.customer_name ?? ''}`} size="lg">
        {viewBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Customer info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f9fafb', borderRadius: 8, padding: 14 }}>
              <div><span style={{ fontSize: 11, color: '#9ca3af' }}>Name</span><p style={{ fontSize: 13, fontWeight: 600, margin: '2px 0 0' }}>{viewBooking.customer_name}</p></div>
              <div><span style={{ fontSize: 11, color: '#9ca3af' }}>Phone</span><p style={{ fontSize: 13, fontWeight: 600, margin: '2px 0 0' }}>{viewBooking.customer_phone}</p></div>
              <div><span style={{ fontSize: 11, color: '#9ca3af' }}>Booking Date</span><p style={{ fontSize: 13, fontWeight: 600, margin: '2px 0 0' }}>{viewBooking.booking_date}</p></div>
              <div><span style={{ fontSize: 11, color: '#9ca3af' }}>Booking Amount</span><p style={{ fontSize: 13, fontWeight: 600, margin: '2px 0 0' }}>{fmt(viewBooking.booking_amount)}</p></div>
              <div>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Agreement</span>
                <p style={{ margin: '2px 0 0' }}>
                  <span style={{ background: (AGR_COLORS[viewBooking.agreement_status] ?? '#9ca3af') + '22', color: AGR_COLORS[viewBooking.agreement_status], borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                    {viewBooking.agreement_status}
                  </span>
                </p>
              </div>
            </div>

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
                      <div>
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
    </AppShell>
  )
}
