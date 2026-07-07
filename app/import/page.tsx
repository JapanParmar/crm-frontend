'use client'

import React, { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { Import, Upload, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { leadsApi } from '@/lib/api'
import { LeadSourceBadge, LeadPriorityBadge } from '@/components/leads/LeadBadges'
import * as XLSX from 'xlsx'

interface ParsedLead {
  name: string
  phone: string
  email?: string
  source: string
  status: string
  priority: string
  budget_max?: number
  notes?: string
  isValid: boolean
  errors: string[]
}

const normalizePhoneNumber = (phone: any): string => {
  if (phone === undefined || phone === null) return ''
  let phoneStr = String(phone).trim()
  
  // If it's in scientific notation (e.g. 9.19346E+11)
  if (/^\d+(\.\d+)?[eE]\+?\d+$/.test(phoneStr)) {
    try {
      const num = Number(phoneStr)
      if (!isNaN(num)) {
        phoneStr = num.toLocaleString('fullwide', { useGrouping: false })
      }
    } catch (e) {
      // fallback
    }
  }

  // Remove trailing .0 if Excel parsed it as a float
  if (phoneStr.endsWith('.0')) {
    phoneStr = phoneStr.slice(0, -2)
  }

  // Remove formatting characters
  return phoneStr.replace(/[\s-()]/g, '')
}

const validateLead = (lead: {
  name: string
  phone: string
  email?: string
  source: string
  status: string
  priority: string
  budget_max?: number
}) => {
  const errors: string[] = []

  if (!lead.name || lead.name.trim() === '') {
    errors.push('Name is required.')
  }

  if (!lead.phone || lead.phone.trim() === '') {
    errors.push('Phone number is required.')
  } else {
    const digits = lead.phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15) {
      errors.push(`Phone number "${lead.phone}" must contain between 10 and 15 digits.`)
    }
  }

  if (lead.email && lead.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(lead.email.trim())) {
      errors.push('Invalid email address format.')
    }
  }

  const validSources = ['magicbricks', '99acres', 'housing', 'meta_ads', 'google_ads', 'website', 'whatsapp', 'referral', 'walk_in', 'facebook', 'instagram', 'other']
  if (lead.source && !validSources.includes(lead.source.toLowerCase())) {
    errors.push(`Invalid source. Allowed values: ${validSources.slice(0, 5).join(', ')}, etc.`)
  }

  const validStatuses = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'closed_won', 'closed_lost', 'on_hold']
  if (lead.status && !validStatuses.includes(lead.status.toLowerCase())) {
    errors.push(`Invalid status. Allowed values: ${validStatuses.slice(0, 5).join(', ')}, etc.`)
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent']
  if (lead.priority && !validPriorities.includes(lead.priority.toLowerCase())) {
    errors.push(`Invalid priority. Allowed values: ${validPriorities.join(', ')}`)
  }

  if (lead.budget_max !== undefined && lead.budget_max !== null) {
    if (isNaN(lead.budget_max) || lead.budget_max < 0) {
      errors.push('Budget max must be a positive integer.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
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

  const downloadTemplate = () => {
    const data = [
      {
        name: 'Arjun Rathore',
        phone: '9876543210',
        email: 'arjun.rathore@example.com',
        source: 'website',
        status: 'new',
        priority: 'medium',
        budget_max: 7500000,
        notes: 'Interested in 3BHK premium apartment'
      },
      {
        name: 'Dev Malhotra',
        phone: '9345678901',
        email: 'dev.malhotra@example.com',
        source: 'magicbricks',
        status: 'contacted',
        priority: 'high',
        budget_max: 12000000,
        notes: 'Looking for luxury villa near highway'
      },
      {
        name: 'Sneha Kapoor',
        phone: '9123456789',
        email: 'sneha.kapoor@example.com',
        source: 'housing',
        status: 'qualified',
        priority: 'urgent',
        budget_max: '',
        notes: 'Prefers ready-to-move-in property'
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Explicitly format phone column as text to prevent scientific notation in Excel
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:H4')
    for (let R = 1; R <= range.e.r; ++R) {
      const cell_address = { c: 1, r: R } // Column B (phone)
      const cell_ref = XLSX.utils.encode_cell(cell_address)
      if (worksheet[cell_ref]) {
        worksheet[cell_ref].t = 's' // Set type to String
      }
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')
    XLSX.writeFile(workbook, 'crm_leads_import_template.xlsx')
  }

  const processFile = (selectedFile: File) => {
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')
    const isCsv = selectedFile.name.endsWith('.csv')

    if (!isExcel && !isCsv) {
      setError('Only CSV and Excel (.xlsx, .xls) files are supported.')
      return
    }
    setError(null)
    setFile(selectedFile)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const bstr = e.target?.result
      if (!bstr) {
        setError('The file is empty.')
        return
      }
      try {
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to array of arrays (rows)
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 })

        if (rows.length < 2) {
          setError('File must contain a header row and at least one lead row.')
          return
        }

        const headers = rows[0].map(h => String(h).toLowerCase().replace(/["\s_]/g, ''))
        
        const nameIdx = headers.findIndex(h => h.includes('name') || h === 'lead')
        const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'))
        const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'))
        const sourceIdx = headers.findIndex(h => h.includes('source') || h.includes('channel'))
        const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('stage'))
        const priorityIdx = headers.findIndex(h => h.includes('priority'))
        const budgetIdx = headers.findIndex(h => h.includes('budget') || h.includes('max'))
        const notesIdx = headers.findIndex(h => h.includes('notes') || h.includes('remark'))

        if (nameIdx === -1 || phoneIdx === -1) {
          setError('File must have columns for Name and Phone Number.')
          return
        }

        const leads: ParsedLead[] = []
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (row.length === 0 || row.every(cell => cell === undefined || cell === null || cell === '')) continue

          const name = nameIdx !== -1 && row[nameIdx] !== undefined ? String(row[nameIdx]).replace(/"/g, '').trim() : ''
          const phone = phoneIdx !== -1 && row[phoneIdx] !== undefined ? normalizePhoneNumber(row[phoneIdx]) : ''
          const email = emailIdx !== -1 && row[emailIdx] !== undefined ? String(row[emailIdx]).replace(/"/g, '').trim() : undefined
          const source = sourceIdx !== -1 && row[sourceIdx] !== undefined ? String(row[sourceIdx]).toLowerCase().trim() : 'other'
          const status = statusIdx !== -1 && row[statusIdx] !== undefined ? String(row[statusIdx]).toLowerCase().trim() : 'new'
          const priority = priorityIdx !== -1 && row[priorityIdx] !== undefined ? String(row[priorityIdx]).toLowerCase().trim() : 'medium'
          
          const budgetRaw = budgetIdx !== -1 && row[budgetIdx] !== undefined ? String(row[budgetIdx]).replace(/[^\d]/g, '') : ''
          const budget_max = budgetRaw ? parseInt(budgetRaw) : undefined
          const notes = notesIdx !== -1 && row[notesIdx] !== undefined ? String(row[notesIdx]).replace(/"/g, '').trim() : undefined

          const rawLead = {
            name,
            phone,
            email: email || undefined,
            source: ['magicbricks', '99acres', 'housing', 'meta_ads', 'google_ads', 'website', 'whatsapp', 'referral', 'walk_in', 'facebook', 'instagram', 'other'].includes(source) ? source : 'other',
            status: ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'closed_won', 'closed_lost', 'on_hold'].includes(status) ? status : 'new',
            priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
            budget_max,
            notes,
          }

          const validation = validateLead(rawLead)

          leads.push({
            ...rawLead,
            isValid: validation.isValid,
            errors: validation.errors,
          })
        }

        if (leads.length === 0) {
          setError('No valid leads parsed from spreadsheet.')
        } else {
          setParsedLeads(leads)
          setImportStatus('preview')
        }
      } catch (err) {
        setError('Error parsing spreadsheet file. Please check format.')
      }
    }
    reader.readAsBinaryString(selectedFile)
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
    const invalidLeads = parsedLeads.filter(l => !l.isValid)
    if (invalidLeads.length > 0) {
      setError('Please correct all validation errors in the spreadsheet before importing.')
      return
    }

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
        failed,
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

  const validCount = parsedLeads.filter(l => l.isValid).length
  const invalidCount = parsedLeads.filter(l => !l.isValid).length

  return (
    <AppShell>
      <AppHeader title="Import" subtitle="Bulk import leads from external sources" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-cream-canvas" style={{ paddingTop: '56px' }}>
        <div className="w-full max-w-2xl bg-white border border-stone-surface rounded-cards p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-stone-surface pb-4">
            <div className="flex items-center gap-2">
              <Import className="w-5 h-5 text-ember" />
              <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight">Bulk Lead Importer</h2>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-ember hover:text-ink-black transition-colors font-bold border border-ember/20 hover:border-ink-black px-2.5 py-1.5 rounded-lg bg-ember/5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template (.xlsx)
            </button>
          </div>

          {importStatus === 'idle' && (
            <div 
              className="border-2 border-dashed border-stone-border/80 rounded-cards p-10 text-center bg-[#fcfbf9] hover:bg-stone-surface/30 cursor-pointer transition-all flex flex-col items-center"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-muted-gray mb-3" />
              <p className="text-sm font-semibold text-heading-charcoal mb-1">Drag and drop your Excel or CSV catalog here</p>
              <p className="text-xs text-muted-gray mb-4">or click to browse from local storage</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv, .xlsx, .xls" 
                className="hidden" 
              />
              <Button type="button" variant="secondary" size="sm">Choose File</Button>
              <p className="text-[10px] text-muted-gray mt-6 leading-relaxed">
                Spreadsheet headers should contain at least: <strong>name</strong>, <strong>phone</strong>.<br />
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
                    {parsedLeads.length} leads parsed ({validCount} valid, {invalidCount} invalid)
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

              {/* Validation Warning Alert Banner */}
              {invalidCount > 0 && (
                <div className="p-3.5 rounded-cards bg-alert-red/5 border border-alert-red/25 text-xs text-alert-red font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-alert-red flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Spreadsheet Contains Validation Errors</p>
                    <p className="text-[10px] text-alert-red/80 font-normal mt-0.5">
                      Please correct the invalid rows highlighted in red below and re-upload the file. Uploading is disabled until all records are valid.
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div>
                <h3 className="text-[10px] font-extrabold text-muted-gray uppercase tracking-wider mb-2">
                  Parsed Lead Records Preview
                </h3>
                <div className="border border-stone-surface rounded-cards overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#fcfbf9] border-b border-stone-surface sticky top-0 z-10">
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal bg-[#fcfbf9]">Name</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal bg-[#fcfbf9]">Phone</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal bg-[#fcfbf9]">Source</th>
                        <th className="px-3 py-2 text-left font-bold text-heading-charcoal bg-[#fcfbf9]">Priority</th>
                        <th className="px-3 py-2 text-right font-bold text-heading-charcoal bg-[#fcfbf9]">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-surface bg-white">
                      {parsedLeads.map((lead, idx) => (
                        <React.Fragment key={idx}>
                          <tr className={lead.isValid ? "hover:bg-[#fcfbf9]" : "bg-alert-red/5 hover:bg-alert-red/10"}>
                            <td className="px-3 py-2.5 font-semibold text-heading-charcoal">
                              {lead.name || <span className="text-alert-red italic font-medium">Missing</span>}
                            </td>
                            <td className="px-3 py-2.5 text-body-brown font-mono">
                              {lead.phone || <span className="text-alert-red italic font-medium">Missing</span>}
                            </td>
                            <td className="px-3 py-2.5"><LeadSourceBadge source={lead.source as any} /></td>
                            <td className="px-3 py-2.5"><LeadPriorityBadge priority={lead.priority as any} /></td>
                            <td className="px-3 py-2.5 text-right">
                              {lead.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-grass-green font-bold bg-grass-green/10 border border-grass-green/20 px-2 py-0.5 rounded-badges">
                                  ✓ Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-alert-red font-bold bg-alert-red/10 border border-alert-red/20 px-2 py-0.5 rounded-badges">
                                  ⚠️ Invalid
                                </span>
                              )}
                            </td>
                          </tr>
                          {!lead.isValid && (
                            <tr className="bg-alert-red/5">
                              <td colSpan={5} className="px-3 pb-2 text-[10px] text-alert-red font-medium">
                                <ul className="list-disc list-inside space-y-0.5 pl-2">
                                  {lead.errors.map((err, errIdx) => (
                                    <li key={errIdx}>{err}</li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={handleReset}>Cancel</Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleStartImport}
                  disabled={invalidCount > 0}
                >
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
                Successfully processed all spreadsheet records. Added <strong>{progress.success}</strong> leads to your active database.
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
