'use client'

import React, { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { Import, Upload, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { leadsApi } from '@/lib/api'
import { LeadSourceBadge, LeadPriorityBadge } from '@/components/leads/LeadBadges'

interface ParsedLead {
  name: string
  phone: string
  email?: string
  source: string
  status: string
  priority: string
  budget_max?: number
  notes?: string
}

export default function ImportPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
  const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'importing' | 'completed'>('idle')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      processFile(selected)
    }
  }

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Only CSV files are supported for parsing in this preview.')
      return
    }
    setError(null)
    setFile(selectedFile)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) {
        setError('The file is empty.')
        return
      }
      try {
        const rows = text.split('\n').map((row) => {
          const result = []
          let insideQuote = false
          let entries = []
          let entry = ''
          for (let i = 0; i < row.length; i++) {
            const char = row[i]
            if (char === '"') {
              insideQuote = !insideQuote
            } else if (char === ',' && !insideQuote) {
              entries.push(entry.trim())
              entry = ''
            } else {
              entry += char
            }
          }
          entries.push(entry.trim())
          return entries
        }).filter(r => r.length > 0 && r.some(cell => cell !== ''))

        if (rows.length < 2) {
          setError('CSV must contain a header row and at least one lead row.')
          return
        }

        const headers = rows[0].map(h => h.toLowerCase().replace(/["\s_]/g, ''))
        
        const nameIdx = headers.findIndex(h => h.includes('name') || h === 'lead')
        const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'))
        const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'))
        const sourceIdx = headers.findIndex(h => h.includes('source') || h.includes('channel'))
        const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('stage'))
        const priorityIdx = headers.findIndex(h => h.includes('priority'))
        const budgetIdx = headers.findIndex(h => h.includes('budget') || h.includes('max'))
        const notesIdx = headers.findIndex(h => h.includes('notes') || h.includes('remark'))

        if (nameIdx === -1 || phoneIdx === -1) {
          setError('CSV must have columns for Name and Phone Number.')
          return
        }

        const leads: ParsedLead[] = []
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (row.length <= Math.max(nameIdx, phoneIdx)) continue

          const name = row[nameIdx]?.replace(/"/g, '') || ''
          const phone = row[phoneIdx]?.replace(/"/g, '') || ''
          if (!name || !phone) continue

          const email = emailIdx !== -1 ? row[emailIdx]?.replace(/"/g, '') : undefined
          const source = sourceIdx !== -1 ? row[sourceIdx]?.toLowerCase() || 'other' : 'other'
          const status = statusIdx !== -1 ? row[statusIdx]?.toLowerCase() || 'new' : 'new'
          const priority = priorityIdx !== -1 ? row[priorityIdx]?.toLowerCase() || 'medium' : 'medium'
          const budget_max = budgetIdx !== -1 ? parseInt(row[budgetIdx]?.replace(/[^\d]/g, '')) || undefined : undefined
          const notes = notesIdx !== -1 ? row[notesIdx]?.replace(/"/g, '') : undefined

          leads.push({
            name,
            phone,
            email: email || undefined,
            source: ['magicbricks', '99acres', 'housing', 'meta_ads', 'google_ads', 'website', 'whatsapp', 'referral', 'walk_in', 'facebook', 'instagram', 'other'].includes(source) ? source : 'other',
            status: ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'closed_won', 'closed_lost', 'on_hold'].includes(status) ? status : 'new',
            priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
            budget_max,
            notes
          })
        }

        if (leads.length === 0) {
          setError('No valid leads parsed from CSV.')
        } else {
          setParsedLeads(leads)
          setImportStatus('preview')
        }
      } catch (err) {
        setError('Error parsing CSV file. Please check format.')
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      processFile(dropped)
    }
  }

  const handleStartImport = async () => {
    setImportStatus('importing')
    setImporting(true)
    setProgress({ current: 0, total: parsedLeads.length, success: 0, failed: 0 })

    let success = 0
    let failed = 0
    for (let i = 0; i < parsedLeads.length; i++) {
      const lead = parsedLeads[i]
      try {
        await leadsApi.create({
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          source: lead.source,
          status: lead.status,
          priority: lead.priority,
          budget_max: lead.budget_max,
          notes: lead.notes,
        })
        success++
      } catch (err) {
        failed++
      }
      setProgress({
        current: i + 1,
        total: parsedLeads.length,
        success,
        failed
      })
    }

    queryClient.invalidateQueries({ queryKey: ['leads'] })
    queryClient.invalidateQueries({ queryKey: ['leads-counts'] })
    setImporting(false)
    setImportStatus('completed')
  }

  const handleReset = () => {
    setFile(null)
    setParsedLeads([])
    setError(null)
    setImportStatus('idle')
    setProgress({ current: 0, total: 0, success: 0, failed: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  return (
    <AppShell>
      <AppHeader title="Import" subtitle="Bulk import leads from external sources" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-cream-canvas select-none" style={{ paddingTop: '56px' }}>
        <div className="w-full max-w-2xl bg-white border border-stone-surface rounded-cards p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Import className="w-5 h-5 text-ember" />
            <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight">Bulk Lead Importer</h2>
          </div>

          {importStatus === 'idle' && (
            <div 
              className="border-2 border-dashed border-stone-border/80 rounded-cards p-10 text-center bg-[#fcfbf9] hover:bg-stone-surface/30 cursor-pointer transition-all flex flex-col items-center"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-muted-gray mb-3" />
              <p className="text-sm font-semibold text-heading-charcoal mb-1">Drag and drop your CSV catalog here</p>
              <p className="text-xs text-muted-gray mb-4">or click to browse from local storage</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />
              <Button type="button" variant="secondary" size="sm">Choose File</Button>
              <p className="text-[10px] text-muted-gray mt-6 leading-relaxed">
                CSV headers should contain at least: <strong>name</strong>, <strong>phone</strong>.<br />
                Optional fields: <em>email, source, status, priority, budget_max, notes</em>.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-cards bg-alert-red/5 border border-alert-red/20 text-xs text-alert-red font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-alert-red" />
              <span>{error}</span>
            </div>
          )}

          {importStatus === 'preview' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-cards bg-cloud border border-stone-border">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-heading-charcoal">{file?.name}</span>
                  <span className="text-[10px] bg-stone-surface px-1.5 py-0.25 rounded text-body-brown">
                    {parsedLeads.length} leads parsed
                  </span>
                </div>
                <button 
                  onClick={handleReset}
                  className="p-1 rounded text-muted-gray hover:text-alert-red hover:bg-stone-surface transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preview Table */}
              <div>
                <h3 className="text-[10px] font-extrabold text-muted-gray uppercase tracking-wider mb-2">
                  Preview (First 5 records)
                </h3>
                <div className="border border-stone-surface rounded-cards overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#fcfbf9] border-b border-stone-surface">
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Name</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Phone</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Source</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-surface">
                      {parsedLeads.slice(0, 5).map((lead, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-3 py-2.5 font-semibold text-heading-charcoal">{lead.name}</td>
                          <td className="px-3 py-2.5 text-body-brown">{lead.phone}</td>
                          <td className="px-3 py-2.5"><LeadSourceBadge source={lead.source as any} /></td>
                          <td className="px-3 py-2.5"><LeadPriorityBadge priority={lead.priority as any} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={handleReset}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleStartImport}>
                  Confirm & Import ({parsedLeads.length} Leads)
                </Button>
              </div>
            </div>
          )}

          {importStatus === 'importing' && (
            <div className="space-y-4 text-center py-6">
              <Loader2 className="w-8 h-8 text-ember animate-spin mx-auto mb-2" />
              <p className="text-sm font-semibold text-heading-charcoal">Importing leads to workspace…</p>
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-stone-surface border border-stone-border rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-ember transition-all duration-100" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-gray mt-2">
                  {progress.current} of {progress.total} processed · {progress.success} success · {progress.failed} failed
                </p>
              </div>
            </div>
          )}

          {importStatus === 'completed' && (
            <div className="space-y-5 text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-grass-green mx-auto mb-2" />
              <h3 className="font-family-display text-lg text-heading-charcoal tracking-tight">Import Completed</h3>
              <p className="text-xs text-body-brown max-w-sm mx-auto leading-relaxed">
                Successfully processed all CSV records. Added <strong>{progress.success}</strong> leads to your active database.
                {progress.failed > 0 && ` Failed to import ${progress.failed} rows due to database constraint duplicates.`}
              </p>
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={handleReset}>Import Another File</Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  )
}
