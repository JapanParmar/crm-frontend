'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Enter a valid 10-digit phone number').max(10),
  alternatePhone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  source: z.string().min(1, 'Select a source'),
  status: z.string().min(1, 'Select status'),
  priority: z.string().min(1, 'Select priority'),
  propertyType: z.string().optional(),
  budget: z.string().optional(),
  budgetMax: z.string().optional(),
  location: z.string().optional(),
  projectInterest: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
})

type LeadFormData = z.infer<typeof leadSchema>

interface AddLeadModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (data: LeadFormData) => Promise<void>
}

export function AddLeadModal({ open, onClose, onSubmit }: AddLeadModalProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      status: 'new',
      priority: 'medium',
    },
  })

  const handleSubmit = async (data: LeadFormData) => {
    setLoading(true)
    try {
      await onSubmit?.(data)
      form.reset()
      onClose()
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Lead"
      description="Fill in the lead details. Required fields are marked with *"
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            onClick={form.handleSubmit(handleSubmit)}
          >
            Create Lead
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Contact Info */}
        <div>
          <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wide mb-2.5">Contact Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Rahul Sharma"
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
            <Input
              label="Phone Number"
              required
              placeholder="10-digit mobile"
              maxLength={10}
              error={form.formState.errors.phone?.message}
              {...form.register('phone')}
            />
            <Input
              label="Alternate Phone"
              placeholder="Optional"
              {...form.register('alternatePhone')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              error={form.formState.errors.email?.message}
              {...form.register('email')}
            />
          </div>
        </div>

        {/* Lead Details */}
        <div>
          <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wide mb-2.5">Lead Details</h3>
          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Source"
              required
              placeholder="Select source"
              error={form.formState.errors.source?.message}
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
              ]}
              {...form.register('source')}
            />
            <Select
              label="Status"
              required
              options={[
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'site_visit', label: 'Site Visit' },
              ]}
              {...form.register('status')}
            />
            <Select
              label="Priority"
              required
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
            <Select
              label="Property Type"
              placeholder="Select type"
              options={[
                { value: 'apartment', label: 'Apartment' },
                { value: 'villa', label: 'Villa' },
                { value: 'plot', label: 'Plot' },
                { value: 'commercial', label: 'Commercial' },
                { value: 'penthouse', label: 'Penthouse' },
                { value: 'studio', label: 'Studio' },
                { value: 'duplex', label: 'Duplex' },
              ]}
              {...form.register('propertyType')}
            />
            <Input
              label="Preferred Location"
              placeholder="e.g. Whitefield, HSR Layout"
              {...form.register('location')}
            />
            <Input
              label="Min Budget (₹)"
              type="number"
              placeholder="e.g. 5000000"
              {...form.register('budget')}
            />
            <Input
              label="Max Budget (₹)"
              type="number"
              placeholder="e.g. 10000000"
              {...form.register('budgetMax')}
            />
            <div className="col-span-2">
              <Input
                label="Project Interest"
                placeholder="e.g. Prestige Skyline, Brigade Utopia"
                {...form.register('projectInterest')}
              />
            </div>
          </div>
        </div>

        {/* Assignment */}
        <div>
          <h3 className="text-xs font-semibold text-muted-gray uppercase tracking-wide mb-2.5">Assignment</h3>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assign To"
              placeholder="Select team member"
              options={[
                { value: 'emp1', label: 'Arjun Rathore' },
                { value: 'emp2', label: 'Sneha Kapoor' },
                { value: 'emp3', label: 'Dev Malhotra' },
                { value: 'emp4', label: 'Priti Saxena' },
              ]}
              {...form.register('assignedTo')}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Textarea
            label="Initial Notes"
            placeholder="Add any relevant notes about this lead..."
            rows={2}
            {...form.register('notes')}
          />
        </div>
      </form>
    </Modal>
  )
}
