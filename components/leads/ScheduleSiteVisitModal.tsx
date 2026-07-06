'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { siteVisitsApi, usersApi, leadsApi } from '@/lib/api'

const schema = z.object({
  lead_id: z.string().optional(),
  project_name: z.string().min(1, 'Project name is required'),
  location: z.string().optional(),
  scheduled_at: z.string().min(1, 'Select date and time'),
  attended_by: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ScheduleSiteVisitModalProps {
  open: boolean
  leadId?: number | string
  onClose: () => void
  onSuccess?: () => void
}

export function ScheduleSiteVisitModal({ open, leadId, onClose, onSuccess }: ScheduleSiteVisitModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.employees().then((r) => r.data.data),
    enabled: open,
  })

  const { data: leadsData } = useQuery({
    queryKey: ['leads-select'],
    queryFn: () => leadsApi.list({ limit: 100 }).then((r) => r.data.data),
    enabled: open && !leadId,
  })

  const employees = employeesData ?? []
  const leads = leadsData ?? []

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      lead_id: '',
      project_name: '',
      location: '',
      scheduled_at: '',
      attended_by: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        lead_id: '',
        project_name: '',
        location: '',
        scheduled_at: '',
        attended_by: '',
        notes: '',
      })
      setError(null)
    }
  }, [open, form])

  const handleSubmit = async (data: FormData) => {
    const targetLeadId = leadId ?? data.lead_id
    if (!targetLeadId) {
      setError('Please select a lead.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await siteVisitsApi.schedule(targetLeadId, {
        project_name: data.project_name,
        location: data.location || undefined,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
        attended_by: data.attended_by ? parseInt(data.attended_by) : undefined,
        notes: data.notes || undefined,
      })
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Failed to schedule site visit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Site Visit"
      description="Orchestrate a physical project walk-through."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" loading={loading} onClick={form.handleSubmit(handleSubmit)}>
            Schedule Visit
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
        {!leadId && (
          <Select
            label="Lead"
            required
            placeholder="Select a lead..."
            options={leads.map((l) => ({ value: String(l.id), label: `${l.name} (${l.phone})` }))}
            error={form.formState.errors.lead_id?.message}
            {...form.register('lead_id')}
          />
        )}

        <Input
          label="Project Name"
          required
          placeholder="e.g. Prestige Skyline / Brigade Utopia"
          error={form.formState.errors.project_name?.message}
          {...form.register('project_name')}
        />

        <Input
          label="Location"
          placeholder="e.g. Whitefield, Tower 3, Flat 402"
          error={form.formState.errors.location?.message}
          {...form.register('location')}
        />

        <Input
          label="Date & Time"
          required
          type="datetime-local"
          error={form.formState.errors.scheduled_at?.message}
          {...form.register('scheduled_at')}
        />

        <Select
          label="Attended By"
          placeholder={employees.length === 0 ? 'Loading team…' : 'Select team member (Optional)'}
          options={employees.map((emp) => ({ value: String(emp.id), label: emp.name }))}
          {...form.register('attended_by')}
        />

        <Textarea
          label="Notes"
          placeholder="Add directions, gate passes, or key focus areas..."
          rows={2}
          {...form.register('notes')}
        />
      </form>
    </Modal>
  )
}
