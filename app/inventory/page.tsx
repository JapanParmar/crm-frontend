'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Warehouse, Plus, Edit2, Trash2, X, ChevronRight,
  Building2, Layers, CheckCircle, Clock, Ban, Home,
  Loader2, RefreshCw, DollarSign, BookOpen,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader, PageHeader } from '@/components/layout/AppHeader'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToastStore } from '@/store/useToastStore'
import {
  inventoryApi, projectsApi,
  ApiTower, ApiUnit, ApiProject,
} from '@/lib/api'

// ── helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  available:  '#22c55e',
  reserved:   '#f59e0b',
  hold:       '#a78bfa',
  booked:     '#3b82f6',
  sold:       '#6b7280',
  cancelled:  '#ef4444',
  blocked:    '#374151',
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available', reserved: 'Reserved', hold: 'On Hold',
  booked: 'Booked', sold: 'Sold', cancelled: 'Cancelled', blocked: 'Blocked',
}

const UNIT_STATUSES = ['available','reserved','hold','booked','sold','cancelled','blocked']
const BHK_TYPES = ['1BHK','2BHK','3BHK','4BHK','Penthouse','Commercial','Plot']
const FACINGS = ['North','South','East','West','NE','NW','SE','SW']

function fmt(n?: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

// ── UnitCard ─────────────────────────────────────────────────────────────────
function UnitCard({ unit, onStatusChange, onEdit }: { unit: ApiUnit; onStatusChange: (u: ApiUnit) => void; onEdit: (u: ApiUnit) => void }) {
  const color = STATUS_COLORS[unit.status] ?? '#9ca3af'
  return (
    <div
      style={{ border: `2px solid ${color}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', background: '#fff', minWidth: 110 }}
      title={`${unit.unit_number} — ${STATUS_LABELS[unit.status]}`}
      onClick={() => onStatusChange(unit)}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a' }}>{unit.unit_number}</div>
      <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{unit.bhk_type}</div>
      {unit.floor_number > 0 && <div style={{ fontSize: 10, color: '#9ca3af' }}>Fl {unit.floor_number}</div>}
      <div style={{ marginTop: 4, display: 'inline-block', background: color + '22', color, borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 600 }}>
        {STATUS_LABELS[unit.status]}
      </div>
      {unit.total_price && <div style={{ fontSize: 10, color: '#374151', marginTop: 3 }}>{fmt(unit.total_price)}</div>}
      <button
        style={{ display: 'block', marginTop: 4, fontSize: 10, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onClick={e => { e.stopPropagation(); onEdit(unit) }}
      >Edit</button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { addToast } = useToastStore()

  const [projects, setProjects] = useState<ApiProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [towers, setTowers] = useState<ApiTower[]>([])
  const [selectedTower, setSelectedTower] = useState<ApiTower | null>(null)
  const [units, setUnits] = useState<ApiUnit[]>([])
  const [loading, setLoading] = useState(false)
  const [unitsLoading, setUnitsLoading] = useState(false)

  // Modals
  const [showTowerModal, setShowTowerModal] = useState(false)
  const [editingTower, setEditingTower] = useState<ApiTower | null>(null)
  const [towerForm, setTowerForm] = useState({ tower_name: '', total_floors: '10', units_per_floor: '4', has_lift: true, parking_details: '' })

  const [showUnitModal, setShowUnitModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<ApiUnit | null>(null)
  const [unitForm, setUnitForm] = useState<Partial<ApiUnit>>({ bhk_type: '2BHK', status: 'available', floor_number: 1 })

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusUnit, setStatusUnit] = useState<ApiUnit | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')

  // ── load projects ──────────────────────────────────────────────────────────
  useEffect(() => {
    projectsApi.list({ limit: 100 }).then(r => {
      const list = r.data.data as ApiProject[]
      setProjects(list)
      if (list.length > 0) setSelectedProjectId(list[0].id)
    }).catch(() => {})
  }, [])

  // ── load towers ────────────────────────────────────────────────────────────
  const loadTowers = useCallback(() => {
    if (!selectedProjectId) return
    setLoading(true)
    inventoryApi.getTowers(selectedProjectId)
      .then(r => { setTowers(r.data.data); setSelectedTower(null); setUnits([]) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedProjectId])

  useEffect(() => { loadTowers() }, [loadTowers])

  // ── load units ─────────────────────────────────────────────────────────────
  const loadUnits = useCallback((tower: ApiTower) => {
    setSelectedTower(tower)
    setUnitsLoading(true)
    inventoryApi.getUnits(tower.id)
      .then(r => setUnits(r.data.data))
      .catch(() => {})
      .finally(() => setUnitsLoading(false))
  }, [])

  // ── Tower CRUD ─────────────────────────────────────────────────────────────
  const openAddTower = () => {
    setEditingTower(null)
    setTowerForm({ tower_name: '', total_floors: '10', units_per_floor: '4', has_lift: true, parking_details: '' })
    setShowTowerModal(true)
  }

  const openEditTower = (t: ApiTower) => {
    setEditingTower(t)
    setTowerForm({ tower_name: t.tower_name, total_floors: String(t.total_floors), units_per_floor: String(t.units_per_floor), has_lift: t.has_lift, parking_details: t.parking_details ?? '' })
    setShowTowerModal(true)
  }

  const saveTower = async () => {
    if (!selectedProjectId) return
    const payload = { ...towerForm, total_floors: Number(towerForm.total_floors), units_per_floor: Number(towerForm.units_per_floor) }
    try {
      if (editingTower) {
        await inventoryApi.updateTower(editingTower.id, payload)
        addToast('Tower updated.', 'success')
      } else {
        await inventoryApi.createTower(selectedProjectId, payload)
        addToast('Tower created.', 'success')
      }
      setShowTowerModal(false)
      loadTowers()
    } catch {}
  }

  const deleteTower = async (t: ApiTower) => {
    if (!confirm(`Delete tower "${t.tower_name}"?`)) return
    try {
      await inventoryApi.deleteTower(t.id)
      addToast('Tower deleted.', 'success')
      loadTowers()
    } catch {}
  }

  // ── Unit CRUD ──────────────────────────────────────────────────────────────
  const openAddUnit = () => {
    setEditingUnit(null)
    setUnitForm({ bhk_type: '2BHK', status: 'available', floor_number: 1 })
    setShowUnitModal(true)
  }

  const openEditUnit = (u: ApiUnit) => {
    setEditingUnit(u)
    setUnitForm({ ...u })
    setShowUnitModal(true)
  }

  const saveUnit = async () => {
    if (!selectedTower) return
    try {
      if (editingUnit) {
        await inventoryApi.updateUnit(editingUnit.id, unitForm)
        addToast('Unit updated.', 'success')
      } else {
        await inventoryApi.createUnit(selectedTower.id, unitForm)
        addToast('Unit created.', 'success')
      }
      setShowUnitModal(false)
      loadUnits(selectedTower)
    } catch {}
  }

  // ── Status change ──────────────────────────────────────────────────────────
  const openStatusModal = (u: ApiUnit) => {
    setStatusUnit(u)
    setNewStatus(u.status)
    setShowStatusModal(true)
  }

  const applyStatusChange = async () => {
    if (!statusUnit) return
    try {
      await inventoryApi.changeUnitStatus(statusUnit.id, newStatus as ApiUnit['status'])
      addToast('Status updated.', 'success')
      setShowStatusModal(false)
      if (selectedTower) loadUnits(selectedTower)
    } catch {}
  }

  // ── Summary counts ─────────────────────────────────────────────────────────
  const summary = UNIT_STATUSES.reduce((acc, s) => {
    acc[s] = units.filter(u => u.status === s).length
    return acc
  }, {} as Record<string, number>)

  // Group units by floor
  const floors = selectedTower
    ? Array.from({ length: selectedTower.total_floors }, (_, i) => selectedTower.total_floors - i)
    : []

  const unitsByFloor = (floor: number) => units.filter(u => u.floor_number === floor)

  return (
    <AppShell>
      <AppHeader title="Inventory Management" subtitle="Tower → Floor → Unit live availability" />
      <div style={{ padding: '24px 28px' }}>
        <PageHeader
          title="Inventory Management"
          description="Tower → Floor → Unit live availability"
        />

        {/* Project selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Project:</label>
          <select
            value={selectedProjectId ?? ''}
            onChange={e => setSelectedProjectId(Number(e.target.value))}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minWidth: 240 }}
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={loadTowers} id="inventory-refresh-btn">
            <RefreshCw style={{ width: 13, height: 13, marginRight: 4 }} /> Refresh
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          {/* Tower list */}
          <div style={{ width: 220, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Towers</span>
              <button
                id="add-tower-btn"
                onClick={openAddTower}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                <Plus style={{ width: 12, height: 12 }} /> Add
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite', color: '#6366f1' }} />
              </div>
            ) : towers.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, padding: '20px 0' }}>No towers yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {towers.map(t => (
                  <div
                    key={t.id}
                    onClick={() => loadUnits(t)}
                    style={{
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      border: selectedTower?.id === t.id ? '2px solid #6366f1' : '1px solid #e5e7eb',
                      background: selectedTower?.id === t.id ? '#eef2ff' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{t.tower_name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                          {t.total_floors} floors · {t.units_per_floor} units/fl
                        </div>
                        <div style={{ fontSize: 11, color: '#22c55e', marginTop: 2 }}>
                          {t.available_units_count ?? '—'} available / {t.units_count ?? '—'} total
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={e => { e.stopPropagation(); openEditTower(t) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                          <Edit2 style={{ width: 12, height: 12 }} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteTower(t) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unit grid */}
          <div style={{ flex: 1 }}>
            {!selectedTower ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#9ca3af' }}>
                <Warehouse style={{ width: 48, height: 48, marginBottom: 12 }} />
                <p style={{ fontSize: 14 }}>Select a tower to view units</p>
              </div>
            ) : (
              <>
                {/* Tower header + summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{selectedTower.tower_name}</h3>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                      {selectedTower.total_floors} Floors · {selectedTower.units_per_floor} units per floor
                      {selectedTower.has_lift && ' · Lift'}
                    </p>
                  </div>
                  <Button id="add-unit-btn" size="sm" onClick={openAddUnit}>
                    <Plus style={{ width: 13, height: 13, marginRight: 4 }} /> Add Unit
                  </Button>
                </div>

                {/* Status legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {UNIT_STATUSES.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[s] }} />
                      {STATUS_LABELS[s]} ({summary[s] ?? 0})
                    </div>
                  ))}
                </div>

                {/* Floor grid */}
                {unitsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {floors.map(floor => (
                      <div key={floor} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 52, textAlign: 'right', paddingTop: 4, fontSize: 11, fontWeight: 700, color: '#6b7280', flexShrink: 0 }}>
                          {floor === 0 ? 'G' : `Fl ${floor}`}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                          {unitsByFloor(floor).length === 0 ? (
                            <div style={{ fontSize: 11, color: '#d1d5db', padding: '6px 0' }}>—</div>
                          ) : (
                            unitsByFloor(floor).map(u => (
                              <UnitCard key={u.id} unit={u} onStatusChange={openStatusModal} onEdit={openEditUnit} />
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                    {floors.length === 0 && units.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {units.map(u => <UnitCard key={u.id} unit={u} onStatusChange={openStatusModal} onEdit={openEditUnit} />)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tower Modal ── */}
      <Modal open={showTowerModal} onClose={() => setShowTowerModal(false)} title={editingTower ? 'Edit Tower' : 'Add Tower'} size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input id="tower-name" label="Tower Name *" value={towerForm.tower_name} onChange={e => setTowerForm(f => ({ ...f, tower_name: e.target.value }))} placeholder="e.g. Tower A" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input id="tower-floors" label="Total Floors *" type="number" min={1} value={towerForm.total_floors} onChange={e => setTowerForm(f => ({ ...f, total_floors: e.target.value }))} />
            <Input id="tower-units-per-floor" label="Units per Floor *" type="number" min={1} value={towerForm.units_per_floor} onChange={e => setTowerForm(f => ({ ...f, units_per_floor: e.target.value }))} />
          </div>
          <Input id="tower-parking" label="Parking Details" value={towerForm.parking_details} onChange={e => setTowerForm(f => ({ ...f, parking_details: e.target.value }))} placeholder="e.g. 2 covered per unit" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={towerForm.has_lift} onChange={e => setTowerForm(f => ({ ...f, has_lift: e.target.checked }))} />
            Has Lift / Elevator
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <Button variant="outline" size="sm" onClick={() => setShowTowerModal(false)}>Cancel</Button>
            <Button id="save-tower-btn" size="sm" onClick={saveTower}>{editingTower ? 'Update' : 'Create'} Tower</Button>
          </div>
        </div>
      </Modal>

      {/* ── Unit Modal ── */}
      <Modal open={showUnitModal} onClose={() => setShowUnitModal(false)} title={editingUnit ? 'Edit Unit' : 'Add Unit'} size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input id="unit-number" label="Unit Number *" value={unitForm.unit_number ?? ''} onChange={e => setUnitForm(f => ({ ...f, unit_number: e.target.value }))} placeholder="e.g. A-101" />
            <Input id="unit-floor" label="Floor Number *" type="number" min={0} value={unitForm.floor_number ?? 1} onChange={e => setUnitForm(f => ({ ...f, floor_number: Number(e.target.value) }))} />
            <Select id="unit-bhk" label="BHK Type *" value={unitForm.bhk_type ?? '2BHK'} onChange={e => setUnitForm(f => ({ ...f, bhk_type: e.target.value }))}>
              {BHK_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select id="unit-facing" label="Facing" value={unitForm.facing ?? ''} onChange={e => setUnitForm(f => ({ ...f, facing: e.target.value }))}>
              <option value="">Select facing</option>
              {FACINGS.map(fc => <option key={fc} value={fc}>{fc}</option>)}
            </Select>
            <Select id="unit-status" label="Status" value={unitForm.status ?? 'available'} onChange={e => setUnitForm(f => ({ ...f, status: e.target.value as ApiUnit['status'] }))}>
              {UNIT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input id="unit-carpet" label="Carpet Area (sqft)" type="number" value={unitForm.carpet_area ?? ''} onChange={e => setUnitForm(f => ({ ...f, carpet_area: Number(e.target.value) }))} />
            <Input id="unit-builtup" label="Built-up Area (sqft)" type="number" value={unitForm.built_up_area ?? ''} onChange={e => setUnitForm(f => ({ ...f, built_up_area: Number(e.target.value) }))} />
            <Input id="unit-super" label="Super Built-up (sqft)" type="number" value={unitForm.super_built_up_area ?? ''} onChange={e => setUnitForm(f => ({ ...f, super_built_up_area: Number(e.target.value) }))} />
          </div>
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>PRICING</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Input id="unit-base-price" label="Base Price (₹)" type="number" value={unitForm.base_price ?? ''} onChange={e => setUnitForm(f => ({ ...f, base_price: Number(e.target.value) }))} />
              <Input id="unit-price-sqft" label="Price/sqft (₹)" type="number" value={unitForm.price_per_sqft ?? ''} onChange={e => setUnitForm(f => ({ ...f, price_per_sqft: Number(e.target.value) }))} />
              <Input id="unit-total-price" label="Total Price (₹)" type="number" value={unitForm.total_price ?? ''} onChange={e => setUnitForm(f => ({ ...f, total_price: Number(e.target.value) }))} />
              <Input id="unit-plc" label="PLC Charges (₹)" type="number" value={unitForm.plc_charges ?? ''} onChange={e => setUnitForm(f => ({ ...f, plc_charges: Number(e.target.value) }))} />
              <Input id="unit-parking-charges" label="Parking Charges (₹)" type="number" value={unitForm.parking_charges ?? ''} onChange={e => setUnitForm(f => ({ ...f, parking_charges: Number(e.target.value) }))} />
              <Input id="unit-gst" label="GST (₹)" type="number" value={unitForm.gst_amount ?? ''} onChange={e => setUnitForm(f => ({ ...f, gst_amount: Number(e.target.value) }))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <Button variant="outline" size="sm" onClick={() => setShowUnitModal(false)}>Cancel</Button>
            <Button id="save-unit-btn" size="sm" onClick={saveUnit}>{editingUnit ? 'Update' : 'Create'} Unit</Button>
          </div>
        </div>
      </Modal>

      {/* ── Status Change Modal ── */}
      <Modal open={showStatusModal} onClose={() => setShowStatusModal(false)} title="Change Unit Status" size="sm">
        {statusUnit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, color: '#374151' }}>
              <strong>{statusUnit.unit_number}</strong> · {statusUnit.bhk_type} · Floor {statusUnit.floor_number}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Current: <span style={{ fontWeight: 600, color: STATUS_COLORS[statusUnit.status] }}>{STATUS_LABELS[statusUnit.status]}</span>
            </div>
            <Select id="change-status-select" label="New Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {UNIT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => setShowStatusModal(false)}>Cancel</Button>
              <Button id="apply-status-btn" size="sm" onClick={applyStatusChange}>Apply</Button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  )
}
