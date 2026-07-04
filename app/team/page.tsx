'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { ManageMemberModal } from '@/components/team/ManageMemberModal'
import { useAppStore } from '@/store/useAppStore'
import { usersApi } from '@/lib/api'
import type { ApiUserWithStats } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils'
import { UserPlus, TrendingUp, Users, CheckCircle2, Clock, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TeamPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const [manageOpen, setManageOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<ApiUserWithStats | null>(null)
  const queryClient = useQueryClient()

  // Fetch all users to allow managing them
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data.data),
  })

  const users: ApiUserWithStats[] = data ?? []
  const activeCount = users.filter((u) => u.is_active).length

  const handleEdit = (user: ApiUserWithStats) => {
    setSelectedMember(user)
    setManageOpen(true)
  }

  const handleCreate = () => {
    setSelectedMember(null)
    setManageOpen(true)
  }

  return (
    <AppShell>
      <AppHeader title="Team" subtitle="Monitor your sales team performance" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />
      <ManageMemberModal
        open={manageOpen}
        member={selectedMember}
        onClose={() => setManageOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['users'] })
        }}
      />

      <main className="flex flex-col h-full bg-cream-canvas" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10">
          <PageHeader
            title="Team"
            description={`${activeCount} active team members`}
            actions={
              <Button variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={handleCreate}>
                Add Member
              </Button>
            }
          />
        </div>

        <div className="flex-1 overflow-auto p-5">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-cards border border-stone-surface p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-stone-surface" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-28 bg-stone-surface rounded" />
                      <div className="h-2.5 w-20 bg-stone-surface rounded" />
                    </div>
                  </div>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-10 bg-stone-surface rounded-cards mb-2" />
                  ))}
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-8 h-8 text-muted-gray mx-auto mb-2" />
              <p className="text-xs text-muted-gray">No team members found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {users.map((user: ApiUserWithStats) => {
                const conversionRate = user.assigned_leads > 0
                  ? ((user.closed_deals / user.assigned_leads) * 100).toFixed(1)
                  : '0.0'

                const isUserAdmin = user.roles?.includes('admin')

                return (
                  <div key={user.id} className="bg-white rounded-cards border border-stone-surface p-5 hover:border-stone-border transition-all relative group">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="md" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-heading-charcoal">{user.name}</p>
                            {isUserAdmin && (
                              <span className="text-[9px] px-1.5 py-0.25 rounded-badges bg-ember/10 text-ember font-bold border border-ember/20 uppercase">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-gray">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit Member"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-grass-green' : 'bg-muted-gray'}`} title={user.is_active ? 'Active' : 'Inactive'} />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      {[
                        { icon: <Users className="w-3 h-3" />, label: 'Assigned Leads', value: user.assigned_leads },
                        { icon: <CheckCircle2 className="w-3 h-3 text-grass-green" />, label: 'Closed Deals', value: user.closed_deals },
                        { icon: <TrendingUp className="w-3 h-3 text-sky-blue" />, label: 'Conversion Rate', value: `${conversionRate}%` },
                        { icon: <Clock className="w-3 h-3 text-alert-red" />, label: 'Pending Follow-ups', value: user.pending_follow_ups },
                      ].map(({ icon, label, value }) => (
                        <div key={label} className="flex items-center justify-between p-2.5 rounded-cards bg-[#fcfbf9] border border-stone-surface">
                          <div className="flex items-center gap-2 text-xs text-body-brown">
                            {icon}{label}
                          </div>
                          <span className="text-xs font-bold text-heading-charcoal">{value}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-muted-gray mt-3">
                      Joined {formatDate(user.created_at, 'short')}
                      {user.phone && ` · ${user.phone}`}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  )
}
