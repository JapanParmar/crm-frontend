'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { leadsApi, usersApi } from '@/lib/api'
import type { ApiLead } from '@/lib/api'

const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Enter a valid 10-digit phone number').max(15),
  alternate_phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  source: z.string().min(1, 'Select a source'),
  status: z.string().min(1, 'Select status'),
  priority: z.string().min(1, 'Select priority'),
  property_type: z.string().optional(),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  preferred_location: z.string().optional(),
  project_interest: z.string().optional(),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
})

type LeadFormData = z.infer<typeof leadSchema>

interface AddLeadModalProps {
  open: boolean
  lead?: ApiLead | null
  onClose: () => void
  onSuccess?: () => void
}

export function AddLeadModal({ open, lead, onClose, onSuccess }: AddLeadModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!lead

  // Load employees from API for the assign dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.employees().then((r) => r.data.data),
    enabled: open,
  })

  const employees = employeesData ?? []

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      status: 'new',
      priority: 'medium',
    },
  })

  // Sync state and form values when lead changes or modal opens
  useEffect(() => {
    if (open) {
      if (lead) {
        form.reset({
          name: lead.name,
          phone: lead.phone,
          alternate_phone: lead.alternate_phone || '',
          email: lead.email || '',
          source: lead.source,
          status: lead.status,
          priority: lead.priority,
          property_type: lead.property_type || '',
          budget_min: lead.budget_min ? String(lead.budget_min) : '',
          budget_max: lead.budget_max ? String(lead.budget_max) : '',
          preferred_location: lead.preferred_location || '',
          project_interest: lead.project_interest || '',
          assigned_to: lead.assigned_to?.id ? String(lead.assigned_to.id) : '',
          notes: lead.notes || '',
        })
      } else {
        form.reset({
          name: '',
          phone: '',
          alternate_phone: '',
          email: '',
          source: '',
          status: 'new',
          priority: 'medium',
          property_type: '',
          budget_min: '',
          budget_max: '',
          preferred_location: '',
          project_interest: '',
          assigned_to: '',
          notes: '',
        })
      }
      setError(null)
    }
  }, [open, lead, form])

  const handleSubmit = async (data: LeadFormData) => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        name: data.name,
        phone: data.phone,
        alternate_phone: data.alternate_phone || undefined,
        email: data.email || undefined,
        source: data.source,
        status: data.status,
        priority: data.priority,
        property_type: data.property_type || undefined,
        budget_min: data.budget_min ? parseInt(data.budget_min) : undefined,
        budget_max: data.budget_max ? parseInt(data.budget_max) : undefined,
        preferred_location: data.preferred_location || undefined,
        project_interest: data.project_interest || undefined,
        assigned_to: data.assigned_to ? parseInt(data.assigned_to) : undefined,
        notes: data.notes || undefined,
      }

      if (isEdit && lead) {
        await leadsApi.update(lead.id, payload)
      } else {
        await leadsApi.create(payload)
      }
      form.reset()
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const msg = e?.response?.data?.message ?? `Failed to ${isEdit ? 'update' : 'create'} lead. Please try again.`
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Lead Details" : "Add New Lead"}
      description={isEdit ? "Update details for this lead." : "Fill in the lead details. Required fields are marked with *"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" loading={loading} onClick={form.handleSubmit(handleSubmit)}>
            {isEdit ? "Save Changes" : "Create Lead"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-cards bg-alert-red/5 border border-alert-red/20 text-xs text-alert-red font-medium">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Contact Info */}
        <div>
          <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wide mb-2.5">Contact Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name" required placeholder="e.g. Rahul Sharma" error={form.formState.errors.name?.message} {...form.register('name')} />
            <Input label="Phone Number" required placeholder="10-digit mobile" maxLength={15} error={form.formState.errors.phone?.message} {...form.register('phone')} />
            <Input label="Alternate Phone" placeholder="Optional" {...form.register('alternate_phone')} />
            <Input label="Email" type="email" placeholder="email@example.com" error={form.formState.errors.email?.message} {...form.register('email')} />
          </div>
        </div>

        {/* Lead Details */}
        <div>
          <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wide mb-2.5">Lead Details</h3>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Source" required placeholder="Select source" error={form.formState.errors.source?.message}
              options={[
                { value: 'magicbricks', label: 'MagicBricks' },
                { value: '99acres', label: '99Acres' },
                { value: 'housing', label: 'Housing.com' },
                { value: 'meta_ads', label: 'Meta Ads' },
                { value: 'google_ads', label: 'Google Ads' },
                { value: 'website', label: 'Website' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'facebook', label: 'Facebook' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'referral', label: 'Referral' },
                { value: 'walk_in', label: 'Walk-In' },
                { value: 'other', label: 'Other' },
              ]}
              {...form.register('source')}
            />
            <Select label="Status" required
              options={[
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'site_visit', label: 'Site Visit' },
                { value: 'negotiation', label: 'Negotiation' },
                { value: 'closed_won', label: 'Closed Won' },
                { value: 'closed_lost', label: 'Closed Lost' },
                { value: 'on_hold', label: 'On Hold' },
              ]}
              {...form.register('status')}
            />
            <Select label="Priority" required
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
              {...form.register('priority')}
            />
          </div>
        </div>

        {/* Property Interest */}
        <div>
          <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wide mb-2.5">Property Interest</h3>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Property Type" placeholder="Select type"
              options={[
                { value: 'apartment', label: 'Apartment' },
                { value: 'villa', label: 'Villa' },
                { value: 'plot', label: 'Plot' },
                { value: 'commercial', label: 'Commercial' },
                { value: 'penthouse', label: 'Penthouse' },
                { value: 'studio', label: 'Studio' },
                { value: 'duplex', label: 'Duplex' },
              ]}
              {...form.register('property_type')}
            />
            <Input label="Preferred Location" placeholder="e.g. Whitefield, HSR Layout" {...form.register('preferred_location')} />
            <Input label="Min Budget (₹)" type="number" placeholder="e.g. 5000000" {...form.register('budget_min')} />
            <Input label="Max Budget (₹)" type="number" placeholder="e.g. 10000000" {...form.register('budget_max')} />
            <div className="col-span-2">
              <Input label="Project Interest" placeholder="e.g. Prestige Skyline, Brigade Utopia" {...form.register('project_interest')} />
            </div>
          </div>
        </div>

        {/* Assignment — loaded from API */}
        <div>
          <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wide mb-2.5">Assignment</h3>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assign To"
              placeholder={employees.length === 0 ? 'Loading team…' : 'Select team member'}
              options={employees.map((emp) => ({ value: String(emp.id), label: emp.name }))}
              {...form.register('assigned_to')}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Textarea label="Initial Notes" placeholder="Add any relevant notes about this lead..." rows={2} {...form.register('notes')} />
        </div>
      </form>
    </Modal>
  )
}
