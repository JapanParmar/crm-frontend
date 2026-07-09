'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { ManageMemberModal } from '@/components/team/ManageMemberModal'
import { useAppStore } from '@/store/useAppStore'
import { useCurrentUser } from '@/store/useAuthStore'
import { usersApi } from '@/lib/api'
import type { ApiUserWithStats } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils'
import { UserPlus, TrendingUp, Users, CheckCircle2, Clock, Edit, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function TeamPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const [manageOpen, setManageOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<ApiUserWithStats | null>(null)
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()

  // Fetch all users to allow managing them
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data.data),
  })

  const users: ApiUserWithStats[] = data ?? []
  const activeCount = users.filter((u) => u.is_active).length

  // Filter & Pagination state
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Filtering Logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch = search.trim() === '' || 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase())

    const matchesRole = roleFilter === 'all' || u.roles?.includes(roleFilter)

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && u.is_active) || 
      (statusFilter === 'inactive' && !u.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

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
              currentUser?.permissions?.includes('manage-users') ? (
                <Button variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={handleCreate}>
                  Add Member
                </Button>
              ) : undefined
            }
          />
          {/* Filters Bar */}
          <div className="max-w-5xl mx-auto px-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full h-9 pl-9 pr-4 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black font-semibold placeholder-muted-gray"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-gray" />
            </div>

            {/* Filter Selects */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Role Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-gray">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-9 px-2.5 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black font-semibold cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-gray">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-9 px-2.5 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black font-semibold cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-cards border border-stone-surface p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-10 w-full rounded-cards" />
                  ))}
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-8 h-8 text-muted-gray mx-auto mb-2" />
              <p className="text-xs text-muted-gray">No team members found</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-cards border border-stone-surface max-w-5xl mx-auto">
              <Users className="w-8 h-8 text-muted-gray mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-heading-charcoal">No team members match your filter criteria</p>
              <p className="text-[11px] text-body-brown mt-1">Try modifying your search text or selecting different roles/statuses.</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Team Performance & Workload Analytics */}
              <section className="bg-white rounded-cards p-6 border border-stone-surface animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight">Team Workload & Sales Performance</h2>
                    <p className="text-xs text-body-brown">Real-time team members efficiency and workload balance</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#fcfbf9] border-b border-stone-surface">
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Team Member</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Lead Share (Workload)</th>
                        <th className="px-3 py-2 text-center font-bold text-heading-charcoal">Closed Won</th>
                        <th className="px-3 py-2 text-center font-bold text-heading-charcoal">Conversion</th>
                        <th className="px-3 py-2 text-center font-bold text-heading-charcoal">Pending Tasks</th>
                        <th className="px-3 py-2 text-right font-bold text-heading-charcoal">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-surface">
                      {paginatedUsers.map((member: ApiUserWithStats) => {
                        const maxLeadsInTeam = Math.max(...filteredUsers.map(m => m.assigned_leads), 1)
                        const workloadPercentage = Math.round((member.assigned_leads / maxLeadsInTeam) * 100)
                        
                        // Calculate conversion rate
                        const conversionRate = member.assigned_leads > 0
                          ? Math.round((member.closed_deals / member.assigned_leads) * 100)
                          : 0

                        // Conversion status styling
                        const convBadge = conversionRate >= 15 
                          ? 'bg-grass-green/10 text-grass-green border-grass-green/20' 
                          : conversionRate >= 5 
                          ? 'bg-sun-yellow/10 text-gold border-sun-yellow/30' 
                          : 'bg-alert-red/10 text-alert-red border-alert-red/20'

                        // Task status health
                        const isHealthy = member.pending_follow_ups <= 5
                        
                        return (
                          <tr key={member.id} className="hover:bg-[#fcfbf9] transition-colors duration-75">
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <Avatar name={member.name} size="xs" />
                                <div>
                                  <p className="font-bold text-heading-charcoal">{member.name}</p>
                                  <p className="text-[10px] text-muted-gray mt-0.5">{member.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 w-[160px]">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-body-brown">
                                  <span>{member.assigned_leads} leads</span>
                                  <span>{workloadPercentage}%</span>
                                </div>
                                <div className="h-1.5 bg-stone-surface border border-stone-border/60 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full bg-ember-orange" 
                                    style={{ width: `${workloadPercentage}%` }} 
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-heading-charcoal text-base">
                              {member.closed_deals}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${convBadge}`}>
                                {conversionRate}%
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-body-brown">
                              {member.pending_follow_ups}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isHealthy ? 'bg-grass-green/10 text-grass-green' : 'bg-alert-red/10 text-alert-red'
                              }`}>
                                {isHealthy ? '✓ Active' : '⚠️ Overloaded'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Individual Team Member Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedUsers.map((user: ApiUserWithStats) => {
                  const conversionRate = user.assigned_leads > 0
                    ? ((user.closed_deals / user.assigned_leads) * 100).toFixed(1)
                    : '0.0'

                  const isUserAdmin = user.roles?.includes('admin') || user.roles?.includes('superadmin')

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
                                  {user.roles?.includes('superadmin') ? 'Superadmin' : 'Admin'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-gray">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {currentUser?.permissions?.includes('manage-users') && (
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit Member"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-stone-surface pt-4 mt-6">
                  <span className="text-xs text-muted-gray">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} members
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-stone-border bg-white text-heading-charcoal disabled:opacity-50 hover:bg-stone-surface transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-heading-charcoal px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-stone-border bg-white text-heading-charcoal disabled:opacity-50 hover:bg-stone-surface transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  )
}
