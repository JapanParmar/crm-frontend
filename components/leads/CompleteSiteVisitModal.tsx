'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { siteVisitsApi } from '@/lib/api'
import type { ApiSiteVisit } from '@/lib/api'

const schema = z.object({
  feedback: z.string().min(1, 'Please record the visit feedback'),
  interested: z.boolean(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CompleteSiteVisitModalProps {
  open: boolean
  siteVisit: ApiSiteVisit | null
  onClose: () => void
  onSuccess?: () => void
}

export function CompleteSiteVisitModal({ open, siteVisit, onClose, onSuccess }: CompleteSiteVisitModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      feedback: '',
      interested: true,
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        feedback: '',
        interested: true,
        notes: '',
      })
      setError(null)
    }
  }, [open, form])

  const handleSubmit = async (data: FormData) => {
    if (!siteVisit) return
    setLoading(true)
    setError(null)
    try {
      await siteVisitsApi.complete(siteVisit.id, {
        feedback: data.feedback,
        interested: data.interested,
        notes: data.notes || undefined,
      })
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Failed to update site visit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Visit Feedback"
      description={`Log the result of site visit for ${siteVisit?.project_name ?? 'project'}.`}
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
          label="Feedback"
          required
          placeholder="What did the client think of the project, layouts, pricing, or amenities?"
          rows={3}
          error={form.formState.errors.feedback?.message}
          {...form.register('feedback')}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-heading-charcoal">Is client interested in the property?</span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-stone-border text-ink-black focus:ring-ink-black"
              {...form.register('interested')}
            />
            <span className="text-xs font-bold text-heading-charcoal">Yes, client is interested</span>
          </label>
        </div>

        <Textarea
          label="Additional Notes"
          placeholder="Optional notes or next steps..."
          rows={2}
          {...form.register('notes')}
        />
      </form>
    </Modal>
  )
}
