'use client'

import React, { useState, useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  PhoneCall,
  MessageSquare,
  Mail,
  Building2,
  CalendarCheck,
  CalendarPlus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

type FollowUpType = 'call' | 'whatsapp' | 'email' | 'meeting' | 'site_visit'
type FollowUpStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled'

interface FollowUp {
  id: string
  leadName: string
  leadId: string
  phone: string
  type: FollowUpType
  status: FollowUpStatus
  scheduledAt: string
  notes?: string
  outcome?: string
  assignedTo: string
  assignedToName: string
}

const TYPE_ICONS: Record<FollowUpType, React.ReactNode> = {
  call: <PhoneCall className="w-3.5 h-3.5" />,
  whatsapp: <MessageSquare className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  meeting: <CalendarCheck className="w-3.5 h-3.5" />,
  site_visit: <Building2 className="w-3.5 h-3.5" />,
}

const TYPE_LABELS: Record<FollowUpType, string> = {
  call: 'Phone Call',
  whatsapp: 'WhatsApp',
  email: 'Email',
  meeting: 'Meeting',
  site_visit: 'Site Visit',
}

const STATUS_CONFIG: Record<FollowUpStatus, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  scheduled: { label: 'Scheduled', icon: <Clock className="w-3 h-3" />, bg: 'rgba(0, 134, 252, 0.08)', text: 'var(--color-sky-blue)' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="w-3 h-3" />, bg: 'rgba(0, 202, 72, 0.08)', text: 'var(--color-grass-green)' },
  missed: { label: 'Missed', icon: <AlertCircle className="w-3 h-3" />, bg: 'rgba(224, 36, 36, 0.08)', text: 'var(--color-alert-red)' },
  cancelled: { label: 'Cancelled', icon: <XCircle className="w-3 h-3" />, bg: 'var(--color-stone-surface)', text: 'var(--color-muted-gray)' },
}
const now = 1785844800000
const MOCK_FOLLOW_UPS: FollowUp[] = [
  { id: '1', leadName: 'Rahul Sharma', leadId: 'lead-1', phone: '9876543210', type: 'call', status: 'scheduled', scheduledAt: new Date(now + 3600000).toISOString(), notes: 'Discuss budget and payment plans', assignedTo: 'emp1', assignedToName: 'Arjun Rathore' },
  { id: '2', leadName: 'Priya Patel', leadId: 'lead-2', phone: '9123456789', type: 'site_visit', status: 'scheduled', scheduledAt: new Date(now + 7200000).toISOString(), notes: 'Visit Prestige Skyline project', assignedTo: 'emp2', assignedToName: 'Sneha Kapoor' },
  { id: '3', leadName: 'Amit Kumar', leadId: 'lead-3', phone: '9345678901', type: 'whatsapp', status: 'missed', scheduledAt: new Date(now - 86400000).toISOString(), notes: 'Send property brochure', assignedTo: 'emp3', assignedToName: 'Dev Malhotra' },
  { id: '4', leadName: 'Sunita Verma', leadId: 'lead-4', phone: '9234567890', type: 'call', status: 'completed', scheduledAt: new Date(now - 3600000).toISOString(), notes: 'Initial contact', outcome: 'Interested in 3BHK, wants to see more options', assignedTo: 'emp1', assignedToName: 'Arjun Rathore' },
  { id: '5', leadName: 'Vikash Singh', leadId: 'lead-5', phone: '9456789012', type: 'email', status: 'scheduled', scheduledAt: new Date(now + 14400000).toISOString(), notes: 'Send project brochure and price list', assignedTo: 'emp4', assignedToName: 'Priti Saxena' },
  { id: '6', leadName: 'Anjali Gupta', leadId: 'lead-6', phone: '9876512345', type: 'call', status: 'scheduled', scheduledAt: new Date(now + 86400000).toISOString(), notes: 'Follow up on site visit feedback', assignedTo: 'emp2', assignedToName: 'Sneha Kapoor' },
  { id: '7', leadName: 'Rohit Mehta', leadId: 'lead-7', phone: '9765432109', type: 'meeting', status: 'scheduled', scheduledAt: new Date(now + 2 * 86400000).toISOString(), notes: 'Discuss payment options', assignedTo: 'emp3', assignedToName: 'Dev Malhotra' },
  { id: '8', leadName: 'Deepa Nair', leadId: 'lead-8', phone: '9654321098', type: 'call', status: 'missed', scheduledAt: new Date(now - 2 * 86400000).toISOString(), assignedTo: 'emp1', assignedToName: 'Arjun Rathore' },
  { id: '9', leadName: 'Suresh Reddy', leadId: 'lead-9', phone: '9543210987', type: 'whatsapp', status: 'completed', scheduledAt: new Date(now - 7200000).toISOString(), outcome: 'Confirmed interest, site visit scheduled', assignedTo: 'emp4', assignedToName: 'Priti Saxena' },
]

export default function FollowUpsPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const [activeTab, setActiveTab] = useState('today')
  const [search, setSearch] = useState('')

  const tabs = [
    { label: 'Today', value: 'today', count: 5 },
    { label: 'Upcoming', value: 'upcoming', count: 3 },
    { label: 'Overdue', value: 'overdue', count: 2 },
    { label: 'Completed', value: 'completed', count: 12 },
    { label: 'All', value: 'all', count: MOCK_FOLLOW_UPS.length },
  ]

  const filtered = useMemo(() => {
    let list = MOCK_FOLLOW_UPS
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((f) => f.leadName.toLowerCase().includes(q) || f.phone.includes(q))
    }
    if (activeTab === 'today') {
      const today = new Date().toDateString()
      list = list.filter((f) => new Date(f.scheduledAt).toDateString() === today || f.status === 'scheduled')
    } else if (activeTab === 'upcoming') {
      list = list.filter((f) => new Date(f.scheduledAt) > new Date() && f.status === 'scheduled')
    } else if (activeTab === 'overdue') {
      list = list.filter((f) => f.status === 'missed')
    } else if (activeTab === 'completed') {
      list = list.filter((f) => f.status === 'completed')
    }
    return list
  }, [search, activeTab])

  return (
    <AppShell>
      <AppHeader title="Follow-ups" subtitle="Track and manage all scheduled follow-ups" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex flex-col h-full bg-cream-canvas" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10">
          <PageHeader
            title="Follow-ups"
            description="Manage all scheduled calls, meetings and visits"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actions={
              <Button variant="primary" size="sm" icon={<CalendarPlus className="w-3.5 h-3.5" />}>
                Schedule Follow-up
              </Button>
            }
          />

          {/* Search */}
          <div className="px-4 py-2.5">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-gray" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search follow-ups..."
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-stone-border bg-white text-xs focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 bg-cream-canvas">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-gray">
              <CalendarCheck className="w-8 h-8 mb-2" />
              <p className="text-sm">No follow-ups found.</p>
            </div>
          ) : (
            <div className="space-y-2 max-w-3xl">
              {filtered.map((fu) => {
                const statusConf = STATUS_CONFIG[fu.status]
                const isOverdue = fu.status === 'missed'
                return (
                  <div
                    key={fu.id}
                    className={cn(
                      'flex items-start gap-3 p-3.5 rounded-cards border bg-white hover:border-stone-border transition-all duration-100 cursor-pointer group',
                      isOverdue ? 'border-stone-border bg-alert-red/5' : 'border-stone-surface'
                    )}
                  >
                    {/* Type Icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border border-stone-border/20"
                      style={{ backgroundColor: statusConf.bg, color: statusConf.text }}
                    >
                      {TYPE_ICONS[fu.type]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link
                          href={`/leads/${fu.leadId}`}
                          className="text-sm font-semibold text-heading-charcoal hover:text-ink-black hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {fu.leadName}
                        </Link>
                        <span className="text-xs text-body-brown">{fu.phone}</span>
                        <span
                          className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
                          style={{ backgroundColor: statusConf.bg, color: statusConf.text, borderColor: statusConf.text + '20' }}
                        >
                          {statusConf.icon}
                          {statusConf.label}
                        </span>
                      </div>
                      <p className="text-xs text-body-brown mb-1">{TYPE_LABELS[fu.type]}</p>
                      {fu.notes && <p className="text-xs text-body-brown">{fu.notes}</p>}
                      {fu.outcome && (
                        <p className="text-xs text-grass-green mt-1 font-semibold">✓ {fu.outcome}</p>
                      )}
                    </div>

                    {/* Right */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={cn('text-xs', isOverdue ? 'text-alert-red font-semibold' : 'text-body-brown')}>
                        {formatDate(fu.scheduledAt, 'long')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Avatar name={fu.assignedToName} size="xs" />
                        <span className="text-xs text-body-brown">{fu.assignedToName.split(' ')[0]}</span>
                      </div>
                      {/* Quick Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={`tel:${fu.phone}`} className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black" title="Call">
                          <PhoneCall className="w-3 h-3" />
                        </a>
                        <a href={`https://wa.me/91${fu.phone}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black" title="WhatsApp">
                          <MessageSquare className="w-3 h-3" />
                        </a>
                        <button className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black text-xs font-semibold px-2" title="Mark complete">
                          ✓ Done
                        </button>
                      </div>
                    </div>
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
