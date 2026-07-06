'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { followUpsApi } from '@/lib/api'
import type { ApiFollowUp } from '@/lib/api'

const schema = z.object({
  outcome: z.string().min(1, 'Please record the outcome of the follow-up'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CompleteFollowUpModalProps {
  open: boolean
  followUp: ApiFollowUp | null
  onClose: () => void
  onSuccess?: () => void
}

export function CompleteFollowUpModal({ open, followUp, onClose, onSuccess }: CompleteFollowUpModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      outcome: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        outcome: '',
        notes: '',
      })
      setError(null)
    }
  }, [open, form])

  const handleSubmit = async (data: FormData) => {
    if (!followUp) return
    setLoading(true)
    setError(null)
    try {
      await followUpsApi.complete(followUp.id, {
        outcome: data.outcome,
        notes: data.notes || undefined,
      })
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Failed to complete follow-up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Complete Follow-up"
      description={`Record the result of the ${followUp?.type ?? 'follow-up'}.`}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" loading={loading} onClick={form.handleSubmit(handleSubmit)}>
            Save Result
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
        <Textarea
          label="Outcome"
          required
          placeholder="e.g. Client interested, asked to call back next week / Property details shared on WhatsApp"
          rows={2}
          error={form.formState.errors.outcome?.message}
          {...form.register('outcome')}
        />

        <Textarea
          label="Additional Notes"
          placeholder="Optional notes or next steps..."
          rows={3}
          {...form.register('notes')}
        />
      </form>
    </Modal>
  )
}
