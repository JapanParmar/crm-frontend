'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { rbacApi, ApiRole } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { 
  Shield, 
  Plus, 
  Check, 
  Lock, 
  Users, 
  Phone, 
  Building2, 
  LayoutDashboard, 
  Activity, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react'

// Permission metadata mapping for premium description display
const PERMISSION_METADATA: Record<string, { title: string; desc: string; category: string; icon: any }> = {
  'manage-users': {
    title: 'Manage Team Members',
    desc: 'Allows adding, editing, and disabling workspace user credentials.',
    category: 'System & Security',
    icon: Users,
  },
  'manage-rbac': {
    title: 'Access Control (RBAC)',
    desc: 'Grants access to configure roles and permissions matrix.',
    category: 'System & Security',
    icon: ShieldCheck,
  },
  'view-all-leads': {
    title: 'View All Leads',
    desc: 'Permits viewing all lead details workspace-wide.',
    category: 'Lead Operations',
    icon: Shield,
  },
  'create-leads': {
    title: 'Create Leads',
    desc: 'Enables creating new leads manually or via quick forms.',
    category: 'Lead Operations',
    icon: Plus,
  },
  'update-leads': {
    title: 'Update Leads',
    desc: 'Allows editing lead contact details, stage, and criteria.',
    category: 'Lead Operations',
    icon: Shield,
  },
  'delete-leads': {
    title: 'Delete Leads',
    desc: 'Allows removing lead records permanently.',
    category: 'Lead Operations',
    icon: AlertCircle,
  },
  'import-leads': {
    title: 'Import Leads',
    desc: 'Allows bulk uploading of leads via CSV files.',
    category: 'Lead Operations',
    icon: Shield,
  },
  'assign-leads': {
    title: 'Assign Leads',
    desc: 'Allows assigning leads to specific sales executives.',
    category: 'Lead Operations',
    icon: Users,
  },
  'view-own-leads': {
    title: 'View Own Leads Only',
    desc: 'Restricts user to see and search only leads assigned to them.',
    category: 'Lead Restrictions',
    icon: Lock,
  },
  'create-followups': {
    title: 'Schedule Follow-ups',
    desc: 'Enables scheduling follow-up calls and meetings for leads.',
    category: 'Follow-ups & Site Visits',
    icon: Phone,
  },
  'update-followups': {
    title: 'Update Follow-ups',
    desc: 'Enables marking follow-ups as completed, missed, or rescheduled.',
    category: 'Follow-ups & Site Visits',
    icon: Phone,
  },
  'create-site-visits': {
    title: 'Schedule Site Visits',
    desc: 'Allows scheduling properties site visits for prospective leads.',
    category: 'Follow-ups & Site Visits',
    icon: Building2,
  },
  'update-site-visits': {
    title: 'Update Site Visits',
    desc: 'Allows recording attendee status and visit feedback summaries.',
    category: 'Follow-ups & Site Visits',
    icon: Building2,
  },
  'view-dashboard': {
    title: 'Access Dashboard',
    desc: 'Grants access to general metrics and daily schedule indicators.',
    category: 'General Access',
    icon: LayoutDashboard,
  },
  'view-activity-log': {
    title: 'View System Audit Log',
    desc: 'Permits browsing activity log feeds across the team.',
    category: 'General Access',
    icon: Activity,
  },
}

export default function RbacPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const queryClient = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [newRoleOpen, setNewRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleError, setNewRoleError] = useState<string | null>(null)
  const [editedPermissions, setEditedPermissions] = useState<string[]>([])
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch Roles and Permissions
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rbacApi.getRoles().then((r) => r.data.data),
  })

  const { data: allPermissions = [], isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rbacApi.getPermissions().then((r) => r.data.data),
  })

  // Select first role automatically on load
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0]

  useEffect(() => {
    if (selectedRole) {
      setSelectedRoleId(selectedRole.id)
      setEditedPermissions(selectedRole.permissions)
      setSaveStatus(null)
    }
  }, [selectedRole])

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: string[] }) =>
      rbacApi.syncPermissions(roleId, permissions),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setSaveStatus({
        type: 'success',
        message: res.data.message || 'Permissions updated successfully.',
      })
      setTimeout(() => setSaveStatus(null), 4000)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update permissions.'
      setSaveStatus({
        type: 'error',
        message: msg,
      })
    },
  })

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (name: string) => rbacApi.createRole({ name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setSelectedRoleId(res.data.data.id)
      setNewRoleOpen(false)
      setNewRoleName('')
      setNewRoleError(null)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create role.'
      setNewRoleError(msg)
    },
  })

  const handleTogglePermission = (perm: string) => {
    if (selectedRole?.name === 'superadmin') return // superadmin cannot be modified
    setEditedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const handleSave = () => {
    if (!selectedRole) return
    syncMutation.mutate({
      roleId: selectedRole.id,
      permissions: editedPermissions,
    })
  }

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) {
      setNewRoleError('Role name is required')
      return
    }
    createRoleMutation.mutate(newRoleName.trim())
  }

  // Group permissions by category
  const categories = Array.from(
    new Set(allPermissions.map((p) => PERMISSION_METADATA[p]?.category || 'General'))
  )

  const isLoading = isLoadingRoles || isLoadingPermissions

  return (
    <AppShell>
      <AppHeader title="Access Control (RBAC)" subtitle="Configure dynamic team access controls" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      {/* New Role Modal */}
      <Modal
        open={newRoleOpen}
        onClose={() => setNewRoleOpen(false)}
        title="Add New Workspace Role"
        description="Create a custom role to define specific access bounds."
        size="sm"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <Input
            label="Role Name"
            placeholder="e.g. sales-manager"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            error={newRoleError || undefined}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNewRoleOpen(false)}
              disabled={createRoleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={createRoleMutation.isPending}
            >
              Create Role
            </Button>
          </div>
        </form>
      </Modal>

      <main className="flex flex-col h-full bg-cream-canvas select-none" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10">
          <PageHeader
            title="Role-Based Access Control"
            description="Manage workspace user permission sets."
            actions={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setNewRoleName('')
                  setNewRoleError(null)
                  setNewRoleOpen(true)
                }}
              >
                Add Role
              </Button>
            }
          />
        </div>

        <div className="flex-1 overflow-hidden p-5 flex flex-col md:flex-row gap-5 max-w-6xl mx-auto w-full h-[calc(100vh-170px)]">
          {/* Left Panel: Roles List */}
          <div className="w-full md:w-64 flex-shrink-0 flex flex-col bg-white border border-stone-surface rounded-cards overflow-hidden h-[300px] md:h-full">
            <div className="p-3.5 border-b border-stone-surface bg-[#fcfbf9]">
              <span className="text-[10px] font-semibold text-muted-gray uppercase tracking-wider">
                Workspace Roles
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-9 bg-stone-surface animate-pulse rounded-cards mb-1.5" />
                ))
              ) : (
                roles.map((role) => {
                  const isActive = role.id === selectedRoleId
                  const isSuper = role.name === 'superadmin'
                  return (
                    <button
                      key={role.id}
                      onClick={() => {
                        setSelectedRoleId(role.id)
                        setEditedPermissions(role.permissions)
                        setSaveStatus(null)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-cards text-xs text-left transition-all ${
                        isActive
                          ? 'bg-ink-black text-white font-bold'
                          : 'hover:bg-stone-surface/50 text-body-brown font-medium'
                      }`}
                    >
                      <span className="capitalize">{role.name === 'rbac' ? 'RBAC' : role.name.replace('-', ' ')}</span>
                      {isSuper ? (
                        <Lock className={`w-3.5 h-3.5 ${isActive ? 'text-sun-yellow' : 'text-muted-gray'}`} />
                      ) : (
                        <span
                          className={`text-[9px] px-1.5 py-0.25 rounded-full font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-stone-surface text-muted-gray border border-stone-border/30'
                          }`}
                        >
                          {role.permissions.length}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Panel: Permissions Grid */}
          <div className="flex-1 flex flex-col bg-white border border-stone-surface rounded-cards overflow-hidden h-full">
            {selectedRole ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-stone-surface bg-[#fcfbf9] flex items-center justify-between flex-shrink-0">
                  <div>
                    <h3 className="text-sm font-extrabold text-heading-charcoal capitalize flex items-center gap-1.5">
                      <span>{selectedRole.name.replace('-', ' ')} Permissions</span>
                      {selectedRole.name === 'superadmin' && (
                        <span className="text-[9px] bg-sun-yellow/20 text-ink-black border border-sun-yellow/40 rounded-badges px-1.5 font-bold uppercase tracking-wider">
                          Read-Only Role
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-muted-gray mt-0.5">
                      {selectedRole.name === 'superadmin' 
                        ? 'Super Admin gets all permissions by default and cannot be modified.'
                        : 'Configure active permission sets for members of this role group.'
                      }
                    </p>
                  </div>
                  {selectedRole.name !== 'superadmin' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      loading={syncMutation.isPending}
                    >
                      Save Configuration
                    </Button>
                  )}
                </div>

                {/* Status Bar */}
                {saveStatus && (
                  <div
                    className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b flex-shrink-0 ${
                      saveStatus.type === 'success'
                        ? 'bg-grass-green/5 text-grass-green border-grass-green/20'
                        : 'bg-alert-red/5 text-alert-red border-alert-red/20'
                    }`}
                  >
                    {saveStatus.type === 'success' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {saveStatus.message}
                  </div>
                )}

                {/* Permissions categories */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {categories.map((cat) => {
                    const catPermissions = allPermissions.filter(
                      (p) => (PERMISSION_METADATA[p]?.category || 'General') === cat
                    )
                    return (
                      <div key={cat} className="space-y-2.5">
                        <h4 className="text-[10px] font-extrabold text-muted-gray uppercase tracking-wider">
                          {cat}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {catPermissions.map((perm) => {
                            const isChecked = editedPermissions.includes(perm)
                            const meta = PERMISSION_METADATA[perm] || {
                              title: perm,
                              desc: 'No description provided.',
                              icon: Shield,
                            }
                            const IconComponent = meta.icon
                            const isDisabled = selectedRole.name === 'superadmin'

                            return (
                              <label
                                key={perm}
                                className={`flex items-start gap-3 p-3 rounded-cards border transition-all ${
                                  isChecked
                                    ? 'bg-[#fcfbf9] border-stone-border/80'
                                    : 'border-stone-surface hover:bg-stone-surface/20'
                                } ${isDisabled ? 'cursor-not-allowed opacity-85' : 'cursor-pointer select-none'}`}
                              >
                                <input
                                  type="checkbox"
                                  className="mt-0.5 w-3.5 h-3.5 accent-ink-black rounded border-stone-border text-ink-black focus:ring-ink-black cursor-pointer disabled:cursor-not-allowed"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(perm)}
                                  disabled={isDisabled}
                                />
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <IconComponent className={`w-3.5 h-3.5 flex-shrink-0 ${isChecked ? 'text-ink-black' : 'text-muted-gray'}`} />
                                    <span className="text-xs font-bold text-heading-charcoal">
                                      {meta.title}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-body-brown leading-normal">
                                    {meta.desc}
                                  </p>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <Shield className="w-12 h-12 text-muted-gray animate-pulse mb-3" />
                <h3 className="font-family-display text-sm font-bold text-heading-charcoal mb-1">
                  No Role Selected
                </h3>
                <p className="text-xs text-muted-gray max-w-xs">
                  Please choose a role from the left menu to manage active system permission sets.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  )
}
