'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/avatar'
import { LeadStatusBadge } from '@/components/leads/LeadBadges'
import { generateMockLeads, LEAD_STATUS_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { Lead, LeadStatus } from '@/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

const PIPELINE_COLUMNS: { status: LeadStatus; color: string; bg: string }[] = [
  { status: 'new', color: 'var(--color-body-brown)', bg: 'var(--color-stone-surface)' },
  { status: 'contacted', color: 'var(--color-sky-blue)', bg: 'rgba(100, 198, 255, 0.08)' },
  { status: 'qualified', color: 'var(--color-grass-green)', bg: 'rgba(0, 201, 120, 0.08)' },
  { status: 'site_visit', color: 'var(--color-gold)', bg: 'rgba(212, 143, 0, 0.08)' },
  { status: 'negotiation', color: 'var(--color-ember-orange)', bg: 'rgba(255, 62, 0, 0.08)' },
  { status: 'closed_won', color: 'var(--color-grass-green)', bg: 'rgba(0, 201, 120, 0.15)' },
]

const ALL_LEADS = generateMockLeads(60)

export default function PipelinePage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()

  const leadsByStatus = PIPELINE_COLUMNS.reduce((acc, col) => {
    acc[col.status] = ALL_LEADS.filter((l) => l.status === col.status).slice(0, 8)
    return acc
  }, {} as Record<LeadStatus, Lead[]>)

  return (
    <AppShell>
      <AppHeader title="Pipeline" subtitle="Visual sales pipeline by stage" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex flex-col h-full bg-cream-canvas select-none" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface px-5 py-4 sticky top-14 z-10 flex flex-col gap-0.5">
          <h2 className="font-family-display text-lg md:text-xl text-heading-charcoal tracking-tight">Sales Pipeline</h2>
          <p className="text-xs text-muted-gray">Monitor property leads and transition stages along the funnel</p>
        </div>

        <div className="flex-1 overflow-x-auto p-5">
          <div className="flex gap-4 h-full" style={{ minWidth: `${PIPELINE_COLUMNS.length * 260}px` }}>
            {PIPELINE_COLUMNS.map(({ status, color, bg }) => {
              const leads = leadsByStatus[status] || []
              const totalValue = leads.reduce((sum, l) => sum + (l.budget || 0), 0)
              return (
                <div
                  key={status}
                  className="flex-1 flex flex-col rounded-cards border border-stone-border bg-white overflow-hidden shadow-sm"
                  style={{ minWidth: '240px', height: 'calc(100vh - 200px)' }}
                >
                  {/* Column Header */}
                  <div
                    className="px-3.5 py-3 border-b border-stone-surface flex items-center justify-between"
                    style={{ backgroundColor: bg }}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-heading-charcoal">{LEAD_STATUS_LABELS[status]}</span>
                        <span
                          className="px-1.5 py-0.25 rounded-full text-[10px] font-bold border ml-0.5 bg-white border-stone-border"
                          style={{ color }}
                        >
                          {leads.length}
                        </span>
                      </div>
                      {totalValue > 0 && (
                        <p className="text-xs mt-0.5 font-bold text-heading-charcoal">
                          {formatCurrency(totalValue)}
                        </p>
                      )}
                    </div>
                    <TrendingUp className="w-3.5 h-3.5" style={{ color }} />
                  </div>

                  {/* Cards container */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#fbfaf9]">
                    {leads.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        className="block bg-white rounded-cards border border-stone-surface p-3 hover:border-stone-border transition-all duration-100 group shadow-sm"
                      >
                        <div className="flex items-start gap-2">
                          <Avatar name={lead.name} size="xs" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-heading-charcoal truncate group-hover:text-ink-black group-hover:underline">
                              {lead.name}
                            </p>
                            <p className="text-[10px] text-body-brown mt-0.5 truncate">{lead.phone}</p>
                          </div>
                        </div>
                        {lead.projectInterest && (
                          <div className="mt-2 text-[10px] text-muted-gray truncate bg-stone-surface px-1.5 py-0.5 rounded border border-stone-border/40">
                            {lead.projectInterest}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-surface/60">
                          {lead.budget ? (
                            <span className="text-[11px] font-bold text-heading-charcoal">{formatCurrency(lead.budget)}</span>
                          ) : (
                            <span />
                          )}
                          {lead.assignedToName && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-muted-gray">{lead.assignedToName.split(' ')[0]}</span>
                              <Avatar name={lead.assignedToName} size="xs" />
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                    {leads.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-gray text-xs border border-dashed border-stone-border/60 rounded-cards bg-white">
                        <span>No character leads</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </AppShell>
  )
}
