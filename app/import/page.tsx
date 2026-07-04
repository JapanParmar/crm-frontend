'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { Import } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ImportPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  return (
    <AppShell>
      <AppHeader title="Import" subtitle="Bulk import leads from external sources" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-cream-canvas select-none" style={{ paddingTop: '56px' }}>
        <div className="border border-dashed border-stone-border rounded-cards p-8 text-center max-w-md bg-white">
          <div className="flex justify-center mb-4">
            <Import className="w-12 h-12 text-ember" />
          </div>
          <h2 className="font-family-display text-xl text-heading-charcoal tracking-tight mb-2">Import Leads</h2>
          <p className="text-xs text-body-brown leading-relaxed mb-6">
            Upload your lead catalog from MagicBricks, 99acres, Housing.com or custom spreadsheets to write them directly into BRICKroots CRM.
          </p>
          <div className="flex flex-col items-center justify-center p-6 border border-stone-surface rounded-cards bg-cloud mb-4">
            <Import className="w-8 h-8 text-muted-gray mb-2" />
            <span className="text-xs font-semibold text-heading-charcoal mb-1">Drag and drop file here</span>
            <span className="text-[10px] text-muted-gray mb-3">or browse from disk</span>
            <Button variant="primary" size="sm">Choose File</Button>
          </div>
          <p className="text-[10px] text-muted-gray">Supports .CSV, .XLSX catalogs</p>
        </div>
      </main>
    </AppShell>
  )
}
