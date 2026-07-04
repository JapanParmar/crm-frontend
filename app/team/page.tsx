'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/ui/stat-card'
import { USER_ROLE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'
import { UserPlus, Phone, Mail, MoreVertical, TrendingUp, CheckCircle2 } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  isActive: boolean
  assignedLeads: number
  closedDeals: number
  conversionRate: number
  pendingFollowUps: number
  lastActive: string
  joinedAt: string
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'emp1',
    name: 'Arjun Rathore',
    email: 'arjun.rathore@propcrm.in',
    phone: '9876543210',
    role: 'sales_manager',
    isActive: true,
    assignedLeads: 124,
    closedDeals: 28,
    conversionRate: 22.6,
    pendingFollowUps: 8,
    lastActive: new Date(Date.now() - 1800000).toISOString(),
    joinedAt: new Date('2023-01-15').toISOString(),
  },
  {
    id: 'emp2',
    name: 'Sneha Kapoor',
    email: 'sneha.kapoor@propcrm.in',
    phone: '9123456789',
    role: 'sales_executive',
    isActive: true,
    assignedLeads: 98,
    closedDeals: 19,
    conversionRate: 19.4,
    pendingFollowUps: 12,
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    joinedAt: new Date('2023-03-20').toISOString(),
  },
  {
    id: 'emp3',
    name: 'Dev Malhotra',
    email: 'dev.malhotra@propcrm.in',
    phone: '9345678901',
    role: 'sales_executive',
    isActive: true,
    assignedLeads: 112,
    closedDeals: 24,
    conversionRate: 21.4,
    pendingFollowUps: 5,
    lastActive: new Date(Date.now() - 7200000).toISOString(),
    joinedAt: new Date('2023-02-10').toISOString(),
  },
  {
    id: 'emp4',
    name: 'Priti Saxena',
    email: 'priti.saxena@propcrm.in',
    phone: '9234567890',
    role: 'sales_executive',
    isActive: true,
    assignedLeads: 87,
    closedDeals: 18,
    conversionRate: 20.7,
    pendingFollowUps: 13,
    lastActive: new Date(Date.now() - 14400000).toISOString(),
    joinedAt: new Date('2023-05-01').toISOString(),
  },
  {
    id: 'emp5',
    name: 'Ravi Shankar',
    email: 'ravi.shankar@propcrm.in',
    phone: '9456789012',
    role: 'sales_executive',
    isActive: false,
    assignedLeads: 45,
    closedDeals: 7,
    conversionRate: 15.6,
    pendingFollowUps: 0,
    lastActive: new Date(Date.now() - 7 * 86400000).toISOString(),
    joinedAt: new Date('2023-08-15').toISOString(),
  },
]

export default function TeamPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()

  return (
    <AppShell>
      <AppHeader title="Team" subtitle="Manage your sales team" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex flex-col h-full bg-cream-canvas" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface px-5 py-4 flex items-center justify-between sticky top-14 z-10 select-none">
          <div>
            <h2 className="font-family-display text-lg md:text-xl text-heading-charcoal tracking-tight">Team Members</h2>
            <p className="text-xs text-muted-gray mt-0.5">{TEAM_MEMBERS.filter(m => m.isActive).length} active, {TEAM_MEMBERS.length} total</p>
          </div>
          <Button variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />}>
            Add Member
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.id}
                className={cn(
                  'bg-white rounded-cards border p-4 transition-all duration-100',
                  member.isActive ? 'border-stone-surface hover:border-stone-border' : 'border-stone-surface opacity-60'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar name={member.name} size="md" />
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white',
                        member.isActive ? 'bg-grass-green' : 'bg-stone-border'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-heading-charcoal">{member.name}</h3>
                        <p className="text-xs text-muted-gray">{USER_ROLE_LABELS[member.role]}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-semibold border',
                            member.isActive ? 'bg-mint text-grass-green border-grass-green/20' : 'bg-stone-surface text-muted-gray border-stone-border'
                          )}
                        >
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button className="p-1 rounded hover:bg-stone-surface text-muted-gray hover:text-ink-black">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5">
                      <a href={`tel:${member.phone}`} className="flex items-center gap-1 text-xs text-body-brown hover:text-ink-black hover:underline">
                        <Phone className="w-3 h-3 text-muted-gray" /> {member.phone}
                      </a>
                      <a href={`mailto:${member.email}`} className="flex items-center gap-1 text-xs text-body-brown hover:text-ink-black hover:underline">
                        <Mail className="w-3 h-3 text-muted-gray" /> {member.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[
                    { label: 'Assigned', value: member.assignedLeads },
                    { label: 'Closed', value: member.closedDeals },
                    { label: 'Conversion', value: `${member.conversionRate}%` },
                    { label: 'Pending', value: member.pendingFollowUps },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center py-2 px-1 rounded-cards bg-[#fcfbf9] border border-stone-border">
                      <p className="text-sm font-bold text-heading-charcoal">{value}</p>
                      <p className="text-[10px] text-muted-gray mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-stone-surface">
                  <p className="text-xs text-muted-gray">
                    Last active: <span className="text-body-brown font-semibold">{formatDate(member.lastActive, 'relative')}</span>
                  </p>
                  <p className="text-xs text-muted-gray">
                    Joined {formatDate(member.joinedAt, 'short')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </AppShell>
  )
}
