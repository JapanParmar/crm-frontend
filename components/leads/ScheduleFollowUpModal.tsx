'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { followUpsApi, usersApi, leadsApi } from '@/lib/api'

const schema = z.object({
  lead_id: z.string().optional(),
  type: z.string().min(1, 'Select a type'),
  scheduled_at: z.string().min(1, 'Select date and time'),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ScheduleFollowUpModalProps {
  open: boolean
  leadId?: number | string
  onClose: () => void
  onSuccess?: () => void
}

export function ScheduleFollowUpModal({ open, leadId, onClose, onSuccess }: ScheduleFollowUpModalProps) {
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
      type: 'call',
      scheduled_at: '',
      assigned_to: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        lead_id: '',
        type: 'call',
        scheduled_at: '',
        assigned_to: '',
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
      await followUpsApi.schedule(targetLeadId, {
        type: data.type,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
        notes: data.notes || undefined,
        assigned_to: data.assigned_to ? parseInt(data.assigned_to) : undefined,
      })
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Failed to schedule follow-up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Follow-up"
      description="Set a reminder for the next engagement."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" loading={loading} onClick={form.handleSubmit(handleSubmit)}>
            Schedule
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

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Type"
            required
            options={[
              { value: 'call', label: 'Call' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'email', label: 'Email' },
              { value: 'meeting', label: 'Meeting' },
              { value: 'site_visit', label: 'Site Visit' },
            ]}
            {...form.register('type')}
          />
          <Input
            label="Date & Time"
            required
            type="datetime-local"
            error={form.formState.errors.scheduled_at?.message}
            {...form.register('scheduled_at')}
          />
        </div>

        <Select
          label="Assign To"
          placeholder={employees.length === 0 ? 'Loading team…' : 'Select team member (Optional)'}
          options={employees.map((emp) => ({ value: String(emp.id), label: emp.name }))}
          {...form.register('assigned_to')}
        />

        <Textarea
          label="Notes"
          placeholder="Add details about the scheduled task..."
          rows={3}
          {...form.register('notes')}
        />
      </form>
    </Modal>
  )
}
