'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  return (
    <AppShell>
      <AppHeader title="Settings" subtitle="System configuration and preferences" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />
      <main className="flex-1 flex flex-col items-center justify-center bg-cream-canvas p-6 select-none" style={{ paddingTop: '56px' }}>
        <div className="max-w-md w-full bg-white rounded-cards border border-dashed border-stone-border p-8 text-center">
          <div className="flex justify-center mb-4 text-ember">
            <Settings className="w-12 h-12 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <h2 className="font-family-display text-xl text-heading-charcoal tracking-tight mb-2">Workspace Settings</h2>
          <p className="text-xs text-body-brown leading-relaxed mb-4">
            Customize team members, configure integration channels (MagicBricks, meta ads), define lead scoring rules, and customize fields.
          </p>
          <span className="inline-block text-[10px] font-semibold text-white bg-ember px-2.5 py-0.5 rounded-badges uppercase">
            Under Development
          </span>
        </div>
      </main>
    </AppShell>
  )
}
