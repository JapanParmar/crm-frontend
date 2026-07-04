'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usersApi } from '@/lib/api'
import type { ApiUserWithStats } from '@/lib/api'

const memberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  role: z.string().min(1, 'Select a role'),
  is_active: z.boolean().default(true),
  password: z.string().optional(),
}).refine((data) => {
  // If password is not provided when creating, validation should fail
  return true
}, {
  message: "Password is required for new members",
  path: ["password"]
})

type MemberFormData = z.infer<typeof memberSchema>

interface ManageMemberModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  member?: ApiUserWithStats | null
}

export function ManageMemberModal({ open, onClose, onSuccess, member }: ManageMemberModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!member

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'employee',
      is_active: true,
      password: '',
    },
  })

  // Reset form when member changes or modal opens
  useEffect(() => {
    if (open) {
      if (member) {
        form.reset({
          name: member.name,
          email: member.email,
          phone: member.phone || '',
          role: member.roles?.[0] || 'employee',
          is_active: member.is_active,
          password: '',
        })
      } else {
        form.reset({
          name: '',
          email: '',
          phone: '',
          role: 'employee',
          is_active: true,
          password: '',
        })
      }
      setError(null)
    }
  }, [open, member, form])

  const handleSubmit = async (data: MemberFormData) => {
    if (!isEdit && !data.password) {
      form.setError('password', { message: 'Password is required for new members' })
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (isEdit && member) {
        await usersApi.update(member.id, {
          name: data.name,
          phone: data.phone || undefined,
          role: data.role,
          is_active: data.is_active,
          password: data.password || undefined,
        })
      } else {
        await usersApi.create({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
          role: data.role,
          is_active: data.is_active,
        })
      }
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const msg = e?.response?.data?.message ?? 'Failed to save member. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Team Member" : "Add New Team Member"}
      description={isEdit ? "Update team member details" : "Create a new team member credential"}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" loading={loading} onClick={form.handleSubmit(handleSubmit)}>
            {isEdit ? "Save Changes" : "Create Member"}
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
        <Input
          label="Full Name"
          required
          placeholder="e.g. Vikramaditya Sen"
          error={form.formState.errors.name?.message}
          {...form.register('name')}
        />

        <Input
          label="Email Address"
          required
          type="email"
          disabled={isEdit}
          placeholder="e.g. v.sen@brickroots.com"
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />

        <Input
          label={isEdit ? "Change Password (optional)" : "Password"}
          required={!isEdit}
          type="password"
          placeholder={isEdit ? "Leave blank to keep current" : "Minimum 8 characters"}
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />

        <Input
          label="Phone Number"
          placeholder="Optional"
          error={form.formState.errors.phone?.message}
          {...form.register('phone')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Workspace Role"
            required
            options={[
              { value: 'employee', label: 'Sales Executive (Employee)' },
              { value: 'admin', label: 'CRM Admin' },
            ]}
            {...form.register('role')}
          />

          <div className="flex flex-col justify-end pb-1.5">
            <span className="text-[10px] font-semibold text-muted-gray uppercase tracking-wider mb-2">Account Status</span>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-stone-border text-ink-black focus:ring-ink-black"
                {...form.register('is_active')}
              />
              <span className="text-xs font-bold text-heading-charcoal">Active Account</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  )
}
