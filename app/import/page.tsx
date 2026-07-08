'use client'

import React, { useState, useRef, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { 
  Import, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Loader2, 
  Trash2, 
  Download, 
  Compass, 
  Check, 
  X, 
  Search, 
  BarChart4, 
  MapPin, 
  TrendingUp, 
  Layers 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { leadsApi } from '@/lib/api'
import { LeadSourceBadge } from '@/components/leads/LeadBadges'
import * as XLSX from 'xlsx'
import { 
  detectProvider, 
  mapRow, 
  PROVIDERS, 
  LeadProvider, 
  ProviderInfo 
} from '@/lib/leadProviders'

interface ParsedLead {
  name: string
  phone: string
  email?: string
  lead_date?: string
  source: string
  service_type?: string
  status: string
  priority: string
  property_type?: string
  budget_max?: number
  preferred_location?: string
  city?: string
  locality?: string
  project_interest?: string
  bhk_preference?: string
  listing_id?: string
  lead_provider_ref?: string
  notes?: string
  isValid: boolean
  errors: string[]
}

const validateRecord = (lead: any) => {
  const errors: string[] = []

  if (!lead.name || lead.name.trim() === '') {
    errors.push('Name is required.')
  }

  if (!lead.phone || lead.phone.trim() === '') {
    errors.push('Phone number is required.')
  } else {
    const digits = lead.phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15) {
      errors.push(`Phone number "${lead.phone}" must be between 10 and 15 digits.`)
    }
  }

  if (lead.email && lead.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(lead.email.trim())) {
      errors.push('Invalid email address format.')
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
  const [detectedFormat, setDetectedFormat] = useState<LeadProvider>('generic')
  const [selectedFormat, setSelectedFormat] = useState<LeadProvider | 'auto'>('auto')
  const [headers, setHeaders] = useState<string[]>([])
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
  const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'importing' | 'completed'>('idle')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'valid' | 'invalid'>('all')
  const [failedLeads, setFailedLeads] = useState<{ lead: ParsedLead; reason: string }[]>([])

  const activeProvider: ProviderInfo = useMemo(() => {
    const providerId = selectedFormat === 'auto' ? detectedFormat : selectedFormat
    return PROVIDERS[providerId]
  }, [detectedFormat, selectedFormat])

  const downloadTemplate = (providerId: LeadProvider) => {
    let data: any[] = []
    let filename = 'template.xlsx'

    if (providerId === 'magicbricks_property') {
      filename = 'magicbricks_property_template.xlsx'
      data = [{
        'Sr. No.': 1,
        'Property Id': 'PR-10029',
        'Brief Desc.': '3BHK apartment with amenities',
        'Name': 'Anil Sharma',
        'Email': 'anil.sharma@example.com',
        'Email Vefification Status': 'Verified',
        'Mobile': '9876543210',
        'Mobile Vefification Status': 'Verified',
        'Landline': '',
        'Locality': 'Whitefield',
        'City': 'Bengaluru',
        'State': 'Karnataka',
        'Status': 'New',
        'Type of Lead': 'Buy',
        'Message Details': 'Interested in buying ready-to-move apartment',
        'Plan To Buy': 'Immediate',
        'Contacted By': '',
        'Message Date': '2026-07-08',
        'Interested In': 'Apartment',
        'Budget': '7500000',
        'High Quality Lead': 'Yes',
        'Nri contact mode': '',
        'Nri local contact': '',
        'Project Name': 'Prestige Skyline',
        'Project Listing': 'Yes'
      }]
    } else if (providerId === '99acres') {
      filename = '99acres_template.xlsx'
      data = [{
        'S No.': 1,
        'Date': '2026-07-08',
        'Name': 'Rahul Patel',
        'Phone No.': '9898989898',
        'Email': 'rahul.patel@example.com',
        'Listing ID': '99A-88392',
        'Business Segment': 'Residential Sale',
        'Property Type': 'Villa',
        'Price of Property': '15000000',
        'City': 'Mumbai',
        'Locality': 'Andheri West',
        'BHK': '4 BHK',
        'Project': 'Godrej Solitaire',
        'Response From': 'Portal Form',
        'Product Type': 'Premium listing',
        'Assigned To': ''
      }]
    } else if (providerId === 'housing') {
      filename = 'housing_template.xlsx'
      data = [{
        'Service Type': 'Buy',
        'Property Type': 'Apartment',
        'Lead Date': '2026-07-08',
        'Lead Name': 'Preeti Sen',
        'Lead Phone Number': '9123456789',
        'Lead Email': 'preeti.sen@example.com',
        'Seller Id': 'SE-2039',
        'Seller Name': 'Builder Direct',
        'Locality': 'New Town',
        'City': 'Kolkata',
        'Configuration': '3 BHK',
        'Price': '6500000',
        'Building/Project Name': 'Rajarhat Residency',
        'Property/Project ID': 'H-88371',
        'Address': 'A-12, Sector 5, Salt Lake',
        'primary_lead_status': 'new',
        'secondary_lead_status': '',
        'Notes': 'Needs home loan support'
      }]
    } else {
      filename = 'brickroots_standard_template.xlsx'
      data = [{
        'Lead Date': '2026-07-08',
        'Source': 'magicbricks',
        'Customer Name': 'Deepak Verma',
        'Mobile': '9944332211',
        'Email': 'deepak.v@example.com',
        'Project Name': 'Brigade Woods',
        'Project Brief': 'Premium 2BHK flat',
        'BHK': '2 BHK',
        'Budget': '8500000',
        'City': 'Bengaluru',
        'Service Type': 'new_project',
        'Project Type': 'apartment',
        'Remarks': 'Wants morning site visit'
      }]
    }

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
    XLSX.writeFile(workbook, filename)
  }

  const parseFileRows = async (fileData: any[], fileHeaders: string[], provider: LeadProvider) => {
    setParsing(true)
    setError(null)
    const leads: ParsedLead[] = []
    
    // Track file-level duplicates
    const seenPhones = new Set<string>()
    const seenEmails = new Set<string>()

    for (let i = 1; i < fileData.length; i++) {
      const row = fileData[i]
      if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === null || c === '')) {
        continue
      }

      // Map row variables to CRM format
      const mapped = mapRow(provider, fileHeaders, row)
      const validation = validateRecord(mapped)
      const rowErrors = [...validation.errors]

      // Check duplicate within the file
      if (mapped.phone) {
        const cleanPhone = mapped.phone.trim()
        if (seenPhones.has(cleanPhone)) {
          rowErrors.push(`Duplicate within file: Phone number '${mapped.phone}' is repeated in this sheet.`)
        } else {
          seenPhones.add(cleanPhone)
        }
      }

      if (mapped.email && mapped.email.trim() !== '') {
        const cleanEmail = mapped.email.trim().toLowerCase()
        if (seenEmails.has(cleanEmail)) {
          rowErrors.push(`Duplicate within file: Email '${mapped.email}' is repeated in this sheet.`)
        } else {
          seenEmails.add(cleanEmail)
        }
      }

      leads.push({
        ...mapped,
        isValid: rowErrors.length === 0 && validation.isValid,
        errors: rowErrors
      })
    }

    // Call API to check database duplicates
    const leadsToCheck = leads
      .filter(l => l.phone || l.email)
      .map(l => ({ phone: l.phone, email: l.email }))

    if (leadsToCheck.length > 0) {
      try {
        const response = await leadsApi.checkDuplicates({ leads: leadsToCheck })
        if (response.data.success && response.data.data) {
          const apiDuplicates = response.data.data

          // Map API duplicate results back to leads
          leads.forEach(lead => {
            const match = apiDuplicates.find(d => 
              (lead.phone && d.phone === lead.phone) || 
              (lead.email && d.email && lead.email.trim().toLowerCase() === d.email.trim().toLowerCase())
            )

            if (match && match.is_duplicate) {
              lead.isValid = false
              lead.errors.push(
                `Duplicate in CRM: Lead already exists in DB as ${match.lead_number} (${match.lead_name}).`
              )
            }
          })
        }
      } catch (err) {
        console.error('Failed to perform DB duplicate validation: ', err)
        setError('Error checking database for duplicate leads. Please try again.')
      }
    }

    setParsedLeads(leads)
    setImportStatus('preview')
    setParsing(false)
  }

  const processFile = (selectedFile: File, formatOverride?: LeadProvider) => {
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
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to array of arrays (rows)
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 })

        if (rows.length < 2) {
          setError('File must contain a header row and at least one lead row.')
          return
        }

        const fileHeaders = rows[0].map(h => String(h || '').trim())
        setHeaders(fileHeaders)

        const detected = detectProvider(fileHeaders)
        setDetectedFormat(detected)

        const activeFormat = formatOverride || (selectedFormat === 'auto' ? detected : selectedFormat)
        parseFileRows(rows, fileHeaders, activeFormat)

      } catch (err) {
        console.error(err)
        setError('Error parsing spreadsheet file. Please check structure and try again.')
      }
    }
    reader.readAsBinaryString(selectedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      processFile(selected)
    }
  }

  const handleFormatOverride = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as LeadProvider | 'auto'
    setSelectedFormat(value)
    if (file) {
      const overrideFormat = value === 'auto' ? detectedFormat : value
      processFile(file, overrideFormat)
    }
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
    const validLeads = parsedLeads.filter(l => l.isValid)
    if (validLeads.length === 0) {
      setError('There are no valid leads to import. Please correct errors or upload a different file.')
      return
    }

    setImportStatus('importing')
    setImporting(true)
    setFailedLeads([])
    setProgress({ current: 0, total: validLeads.length, success: 0, failed: 0 })

    let success = 0
    let failed = 0
    const localFailedLeads: { lead: ParsedLead; reason: string }[] = []

    for (let i = 0; i < validLeads.length; i++) {
      const lead = validLeads[i]
      try {
        await leadsApi.create({
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          lead_date: lead.lead_date || undefined,
          source: lead.source,
          service_type: lead.service_type || undefined,
          status: lead.status,
          priority: lead.priority,
          property_type: lead.property_type || undefined,
          budget_max: lead.budget_max,
          preferred_location: lead.preferred_location || undefined,
          city: lead.city || undefined,
          locality: lead.locality || undefined,
          project_interest: lead.project_interest || undefined,
          bhk_preference: lead.bhk_preference || undefined,
          listing_id: lead.listing_id || undefined,
          lead_provider_ref: lead.lead_provider_ref || undefined,
          notes: lead.notes,
        })
        success++
      } catch (err) {
        console.error('Failed to import row: ', lead, err)
        failed++
        const axiosError = err as any
        const backendErrors = axiosError.response?.data?.errors
        let reason = axiosError.response?.data?.message || axiosError.message || 'Unknown validation error'
        if (backendErrors && typeof backendErrors === 'object') {
          reason = Object.values(backendErrors).flat().join(', ')
        }
        localFailedLeads.push({ lead, reason })
      }
      setProgress({
        current: i + 1,
        total: validLeads.length,
        success,
        failed,
      })
    }

    setFailedLeads(localFailedLeads)
    queryClient.invalidateQueries({ queryKey: ['leads'] })
    queryClient.invalidateQueries({ queryKey: ['leads-counts'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    setImporting(false)
    setImportStatus('completed')
  }

  const handleReset = () => {
    setFile(null)
    setParsedLeads([])
    setHeaders([])
    setFailedLeads([])
    setError(null)
    setImportStatus('idle')
    setProgress({ current: 0, total: 0, success: 0, failed: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Pre-import Analytics / Metrics
  const fileStats = useMemo(() => {
    const total = parsedLeads.length
    const valid = parsedLeads.filter(l => l.isValid).length
    const invalid = total - valid

    // Service type count
    const services: Record<string, number> = {}
    // City count
    const cities: Record<string, number> = {}
    // Budget Ranges
    let budgetUnder50L = 0
    let budget50LTo1Cr = 0
    let budget1CrTo2Cr = 0
    let budgetOver2Cr = 0
    let noBudget = 0

    parsedLeads.forEach(lead => {
      const st = lead.service_type || 'unclassified'
      services[st] = (services[st] || 0) + 1

      const c = lead.city || 'Unknown'
      cities[c] = (cities[c] || 0) + 1

      const b = lead.budget_max
      if (b === undefined || b === null) {
        noBudget++
      } else if (b < 5000000) {
        budgetUnder50L++
      } else if (b >= 5000000 && b <= 10000000) {
        budget50LTo1Cr++
      } else if (b > 10000000 && b <= 20000000) {
        budget1CrTo2Cr++
      } else {
        budgetOver2Cr++
      }
    })

    return {
      total,
      valid,
      invalid,
      services,
      cities: Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 5),
      budgets: {
        '<50L': budgetUnder50L,
        '50L-1Cr': budget50LTo1Cr,
        '1Cr-2Cr': budget1CrTo2Cr,
        '>2Cr': budgetOver2Cr,
        'Unspecified': noBudget
      }
    }
  }, [parsedLeads])

  // Filter & Search Preview Leads
  const filteredLeads = useMemo(() => {
    return parsedLeads.filter(lead => {
      // search term
      const searchMatch = !searchTerm ? true : (
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.city && lead.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.project_interest && lead.project_interest.toLowerCase().includes(searchTerm.toLowerCase()))
      )

      // valid/invalid filter
      const statusMatch = filterType === 'all' ? true : (
        filterType === 'valid' ? lead.isValid : !lead.isValid
      )

      return searchMatch && statusMatch
    })
  }, [parsedLeads, searchTerm, filterType])

  return (
    <AppShell>
      <AppHeader title="Bulk Import Leads" subtitle="Upload spreadsheet files from MagicBricks, 99Acres, Housing.com or Custom templates" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex-1 overflow-auto bg-cream-canvas p-6 lg:p-8" style={{ paddingTop: '76px' }}>
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header Action Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-surface p-5 rounded-cards shadow-sm">
            <div>
              <h2 className="font-family-display text-lg text-heading-charcoal tracking-tight flex items-center gap-2">
                <Import className="w-5 h-5 text-ember-orange" />
                Multi-Provider Intelligent Parser
              </h2>
              <p className="text-xs text-body-brown mt-0.5">Auto-detects columns, normalizes phone numbers, parses budgets, and segments service types.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-gray">Template Downloads:</span>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => downloadTemplate('magicbricks_property')} className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FF5722]/5 text-[#FF5722] hover:bg-[#FF5722]/10 border border-[#FF5722]/20 px-2 py-1.5 rounded-lg transition-colors">
                  <Download className="w-3 h-3" /> MagicBricks
                </button>
                <button onClick={() => downloadTemplate('99acres')} className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#4CAF50]/5 text-[#4CAF50] hover:bg-[#4CAF50]/10 border border-[#4CAF50]/20 px-2 py-1.5 rounded-lg transition-colors">
                  <Download className="w-3 h-3" /> 99Acres
                </button>
                <button onClick={() => downloadTemplate('housing')} className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#2196F3]/5 text-[#2196F3] hover:bg-[#2196F3]/10 border border-[#2196F3]/20 px-2 py-1.5 rounded-lg transition-colors">
                  <Download className="w-3 h-3" /> Housing.com
                </button>
                <button onClick={() => downloadTemplate('standard')} className="inline-flex items-center gap-1 text-[10px] font-bold bg-ember/5 text-ember hover:bg-ember/10 border border-ember/20 px-2 py-1.5 rounded-lg transition-colors">
                  <Download className="w-3 h-3" /> Standard
                </button>
              </div>
            </div>
          </div>

          {parsing && (
            <div className="bg-white border border-stone-surface rounded-cards p-16 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm">
              <Loader2 className="w-12 h-12 text-ember-orange animate-spin mb-4" />
              <h3 className="font-family-display text-base font-bold text-heading-charcoal">Analyzing Leads</h3>
              <p className="text-xs text-body-brown mt-1">Checking for file-level duplicates and checking database records...</p>
            </div>
          )}

          {importStatus === 'idle' && !parsing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Settings Panel */}
              <div className="bg-white border border-stone-surface rounded-cards p-6 space-y-4">
                <h3 className="font-family-display text-sm font-bold text-heading-charcoal uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-ember-orange" />
                  Parser Configuration
                </h3>
                
                <div className="space-y-1">
                  <label htmlFor="format-select" className="text-[11px] font-extrabold text-muted-gray uppercase tracking-wider">Format Matching Mode</label>
                  <select 
                    id="format-select"
                    value={selectedFormat}
                    onChange={handleFormatOverride}
                    className="w-full h-10 px-3 border border-stone-border bg-white text-xs text-body-brown rounded-lg focus:outline-none focus:border-ink-black font-medium"
                  >
                    <option value="auto">🔍 Intelligent Auto-Detect Format</option>
                    <option value="magicbricks_property">MagicBricks Property Portal Sheet</option>
                    <option value="magicbricks_project">MagicBricks Project Portal Sheet</option>
                    <option value="99acres">99acres Leads Portal Sheet</option>
                    <option value="housing">Housing.com Leads Portal Sheet</option>
                    <option value="standard">Brickroots Standard Leads Template</option>
                    <option value="generic">Generic Name & Phone Spreadsheet</option>
                  </select>
                </div>

                <div className="text-xs text-muted-gray leading-relaxed bg-[#fcfbf9] border border-stone-surface p-3.5 rounded-xl space-y-2">
                  <p className="font-semibold text-heading-charcoal">Selected Parser Mode:</p>
                  <p>{activeProvider.description}</p>
                  <div className="pt-1.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: activeProvider.color }} />
                    <span className="text-[10px] uppercase font-bold text-heading-charcoal">{activeProvider.label}</span>
                  </div>
                </div>
              </div>

              {/* Upload Drag/Drop Box */}
              <div className="md:col-span-2">
                <div 
                  className="border-2 border-dashed border-stone-border/80 rounded-cards p-16 text-center bg-white hover:bg-stone-surface/10 cursor-pointer transition-all flex flex-col items-center justify-center h-full min-h-[280px]"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-muted-gray mb-3.5" />
                  <h4 className="text-sm font-semibold text-heading-charcoal mb-1">Drag and drop your lead file here</h4>
                  <p className="text-xs text-muted-gray mb-4">Accepts CSV, XLSX or XLS formats</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".csv, .xlsx, .xls" 
                    className="hidden" 
                  />
                  <Button type="button" variant="primary" size="sm">Choose File</Button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-cards bg-alert-red/5 border border-alert-red/20 text-xs text-alert-red font-medium flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-alert-red flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PREVIEW & PRE-IMPORT TELEMETRY */}
          {importStatus === 'preview' && (
            <div className="space-y-6">
              
              {/* File Info & Active Parser Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-cards bg-cloud/50 border border-stone-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-heading-charcoal">{file?.name}</h3>
                    <p className="text-[10px] text-muted-gray mt-0.5">
                      Spreadsheet contains {parsedLeads.length} total rows · {headers.length} columns detected
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-white border border-stone-border rounded-xl">
                    <span className="text-muted-gray">Detected Format:</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase" style={{ backgroundColor: PROVIDERS[detectedFormat].color }}>
                      {PROVIDERS[detectedFormat].label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-gray">Parser:</span>
                    <select 
                      value={selectedFormat}
                      onChange={handleFormatOverride}
                      className="h-8 px-2.5 border border-stone-border bg-white text-xs rounded-lg font-bold text-body-brown focus:outline-none"
                    >
                      <option value="auto">Auto ({PROVIDERS[detectedFormat].label})</option>
                      <option value="magicbricks_property">MagicBricks Property</option>
                      <option value="magicbricks_project">MagicBricks Project</option>
                      <option value="99acres">99Acres</option>
                      <option value="housing">Housing.com</option>
                      <option value="standard">Standard</option>
                      <option value="generic">Generic</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleReset}
                    className="p-2 rounded-lg text-muted-gray hover:text-alert-red hover:bg-white border border-transparent hover:border-stone-border transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* SHEET PRE-IMPORT METRICS & CHARTS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Statistics KPI */}
                <div className="bg-white border border-stone-surface rounded-cards p-5 space-y-4">
                  <h4 className="text-[10px] font-bold text-muted-gray uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-ember-orange" />
                    Record Quality
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-[#fcfbf9] border border-stone-surface p-3 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-muted-gray uppercase">Valid</span>
                      <p className="text-lg font-bold text-grass-green mt-0.5">{fileStats.valid}</p>
                    </div>
                    <div className="bg-[#fcfbf9] border border-stone-surface p-3 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-muted-gray uppercase">Invalid</span>
                      <p className="text-lg font-bold text-alert-red mt-0.5">{fileStats.invalid}</p>
                    </div>
                  </div>
                  {fileStats.invalid > 0 && (
                    <div className="bg-alert-red/5 border border-alert-red/10 p-2.5 rounded-lg text-[10px] text-alert-red font-medium leading-relaxed">
                      ⚠️ Correct the red rows highlighted in the list below before uploading.
                    </div>
                  )}
                </div>

                {/* SVG Service Type Chart */}
                <div className="bg-white border border-stone-surface rounded-cards p-5 space-y-3.5">
                  <h4 className="text-[10px] font-bold text-muted-gray uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-ember-orange" />
                    Service Type Segment
                  </h4>
                  <div className="h-[80px] flex items-end gap-2.5 justify-center pt-2">
                    {['new_project', 'resale', 'rental', 'unclassified'].map(type => {
                      const count = fileStats.services[type] || 0
                      const percent = fileStats.total > 0 ? (count / fileStats.total) * 100 : 0
                      const color = type === 'new_project' ? 'var(--color-sun-yellow)' : type === 'resale' ? 'var(--color-grass-green)' : type === 'rental' ? 'var(--color-sky-blue)' : 'var(--color-mist)'
                      const label = type === 'new_project' ? 'New' : type === 'resale' ? 'Resale' : type === 'rental' ? 'Rent' : 'N/A'
                      return (
                        <div key={type} className="flex-1 flex flex-col items-center group relative">
                          <div className="text-[9px] font-bold text-heading-charcoal mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 bg-white border border-stone-border px-1.5 py-0.25 rounded shadow-sm z-10">{count}</div>
                          <div className="w-6 rounded-t-sm transition-all duration-300 hover:opacity-85" style={{ height: `${Math.max(percent, 4)}%`, backgroundColor: color }} />
                          <span className="text-[8px] font-bold text-muted-gray mt-1.5">{label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* SVG City breakdown Chart */}
                <div className="bg-white border border-stone-surface rounded-cards p-5 space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-gray uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-ember-orange" />
                    Top Cities
                  </h4>
                  <div className="space-y-2 pt-1.5">
                    {fileStats.cities.length === 0 ? (
                      <p className="text-[10px] text-muted-gray text-center py-4">No cities specified</p>
                    ) : (
                      fileStats.cities.map(([city, count]) => {
                        const percent = fileStats.total > 0 ? (count / fileStats.total) * 100 : 0
                        return (
                          <div key={city} className="space-y-0.5">
                            <div className="flex justify-between text-[9px] font-bold text-heading-charcoal">
                              <span className="truncate max-w-[80px]">{city}</span>
                              <span>{count}</span>
                            </div>
                            <div className="h-1 bg-stone-surface rounded-full overflow-hidden">
                              <div className="h-full bg-ember-orange rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* SVG Budget Ranges Chart */}
                <div className="bg-white border border-stone-surface rounded-cards p-5 space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-gray uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart4 className="w-3.5 h-3.5 text-ember-orange" />
                    Budget Distribution
                  </h4>
                  <div className="space-y-2 pt-1.5">
                    {Object.entries(fileStats.budgets).map(([range, count]) => {
                      const percent = fileStats.total > 0 ? (count / fileStats.total) * 100 : 0
                      if (count === 0) return null
                      return (
                        <div key={range} className="space-y-0.5">
                          <div className="flex justify-between text-[9px] font-bold text-heading-charcoal">
                            <span>{range}</span>
                            <span>{count}</span>
                          </div>
                          <div className="h-1 bg-stone-surface rounded-full overflow-hidden">
                            <div className="h-full bg-sun-yellow rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* LIST SEARCH AND FILTERS */}
              <div className="bg-white border border-stone-surface rounded-cards p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm select-none">
                <div className="flex items-center gap-1.5 bg-[#fcfbf9] border border-stone-border rounded-xl px-3 h-9 w-full sm:max-w-xs">
                  <Search className="w-4 h-4 text-muted-gray flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search parsed records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none text-xs focus:outline-none w-full text-heading-charcoal placeholder-muted-gray"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex border border-stone-border rounded-xl overflow-hidden text-[10px] font-bold bg-[#fcfbf9] h-9">
                    <button 
                      onClick={() => setFilterType('all')} 
                      className={`px-3.5 border-r border-stone-border h-full flex items-center ${filterType === 'all' ? 'bg-obsidian text-white' : 'text-body-brown hover:bg-stone-surface/30'}`}
                    >
                      All ({parsedLeads.length})
                    </button>
                    <button 
                      onClick={() => setFilterType('valid')} 
                      className={`px-3.5 border-r border-stone-border h-full flex items-center ${filterType === 'valid' ? 'bg-obsidian text-white' : 'text-body-brown hover:bg-stone-surface/30'}`}
                    >
                      Valid ({fileStats.valid})
                    </button>
                    <button 
                      onClick={() => setFilterType('invalid')} 
                      className={`px-3.5 h-full flex items-center ${filterType === 'invalid' ? 'bg-obsidian text-white' : 'text-body-brown hover:bg-stone-surface/30'}`}
                    >
                      Invalid ({fileStats.invalid})
                    </button>
                  </div>

                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleStartImport}
                    disabled={fileStats.valid === 0 || importing}
                    className="h-9"
                  >
                    Confirm & Import {fileStats.valid} Leads
                  </Button>
                </div>
              </div>

              {fileStats.invalid > 0 && (
                <div className="p-3 bg-sun-yellow/10 border border-sun-yellow/30 text-[11px] text-body-brown rounded-cards flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#E67E22] flex-shrink-0" />
                  <span>
                    <strong>Notice:</strong> We detected {fileStats.invalid} duplicate or invalid leads. 
                    They are highlighted in red and will be automatically skipped. Only the {fileStats.valid} valid leads will be imported.
                  </span>
                </div>
              )}

              {/* LIST TABLE */}
              <div className="bg-white border border-stone-surface rounded-cards overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#fcfbf9] border-b border-stone-surface sticky top-0 z-10">
                        <th className="px-4 py-2.5 text-left font-bold text-heading-charcoal bg-[#fcfbf9]">Name</th>
                        <th className="px-4 py-2.5 text-left font-bold text-heading-charcoal bg-[#fcfbf9]">Contact Details</th>
                        <th className="px-4 py-2.5 text-left font-bold text-heading-charcoal bg-[#fcfbf9]">Portal / Source</th>
                        <th className="px-4 py-2.5 text-left font-bold text-heading-charcoal bg-[#fcfbf9]">Interest Details</th>
                        <th className="px-4 py-2.5 text-right font-bold text-heading-charcoal bg-[#fcfbf9]">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-surface">
                      {filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-muted-gray font-medium">
                            No records matching the filter settings
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((lead, idx) => (
                          <React.Fragment key={idx}>
                            <tr className={lead.isValid ? "hover:bg-[#fcfbf9] transition-colors" : "bg-alert-red/5 hover:bg-alert-red/10"}>
                              <td className="px-4 py-3 font-semibold text-heading-charcoal">
                                {lead.name || <span className="text-alert-red italic font-medium">Missing Name</span>}
                              </td>
                              <td className="px-4 py-3 text-body-brown">
                                <div className="font-mono">{lead.phone || <span className="text-alert-red italic font-medium">Missing Phone</span>}</div>
                                {lead.email && <div className="text-[10px] text-muted-gray mt-0.5">{lead.email}</div>}
                              </td>
                              <td className="px-4 py-3">
                                <LeadSourceBadge source={lead.source as any} />
                                {lead.lead_date && <div className="text-[10px] text-muted-gray mt-0.5">Enquiry: {lead.lead_date}</div>}
                              </td>
                              <td className="px-4 py-3 text-body-brown">
                                <div className="font-semibold text-heading-charcoal">
                                  {lead.project_interest || lead.property_type || 'Unspecified Interest'}
                                  {lead.bhk_preference && ` (${lead.bhk_preference})`}
                                </div>
                                <div className="text-[10px] text-muted-gray mt-0.5">
                                  {[lead.locality, lead.city].filter(Boolean).join(', ') || 'No location info'}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {lead.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-grass-green font-bold bg-grass-green/10 border border-grass-green/20 px-2 py-0.5 rounded-badges">
                                    <Check className="w-3 h-3" /> Valid Record
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-alert-red font-bold bg-alert-red/10 border border-alert-red/20 px-2 py-0.5 rounded-badges">
                                    <X className="w-3 h-3" /> Errors Detected
                                  </span>
                                )}
                              </td>
                            </tr>
                            {!lead.isValid && (
                              <tr className="bg-alert-red/5">
                                <td colSpan={5} className="px-4 pb-3 pt-0 text-[10px] text-alert-red font-medium">
                                  <ul className="list-disc list-inside space-y-0.5 pl-2">
                                    {lead.errors.map((err, errIdx) => (
                                      <li key={errIdx}>{err}</li>
                                    ))}
                                  </ul>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {importStatus === 'importing' && (
            <div className="bg-white border border-stone-surface rounded-cards p-10 text-center space-y-5">
              <Loader2 className="w-10 h-10 text-ember animate-spin mx-auto" />
              <div>
                <h3 className="font-family-display text-base font-bold text-heading-charcoal">Importing Leads to Active Workspace</h3>
                <p className="text-xs text-body-brown mt-1">Uploading and validating against database constraints...</p>
              </div>
              
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-stone-surface border border-stone-border rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-ember transition-all duration-100" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-muted-gray mt-3">
                  {progress.current} of {progress.total} processed · {progress.success} success · {progress.failed} failed
                </p>
              </div>
            </div>
          )}

          {importStatus === 'completed' && (
            <div className="bg-white border border-stone-surface rounded-cards p-10 text-center space-y-5">
              <CheckCircle2 className="w-14 h-14 text-grass-green mx-auto" />
              <div>
                <h3 className="font-family-display text-lg text-heading-charcoal tracking-tight">Import Sequence Completed</h3>
                <p className="text-xs text-body-brown max-w-md mx-auto leading-relaxed mt-1.5">
                  The spreadsheet records have been normalized and stored. Added <strong>{progress.success}</strong> leads to your active database.
                  {progress.failed > 0 && ` Skipped or failed to import ${progress.failed} rows due to validation or duplicates.`}
                </p>
              </div>

              {failedLeads.length > 0 && (
                <div className="max-w-xl mx-auto text-left border border-stone-border rounded-xl overflow-hidden bg-[#fcfbf9] shadow-sm">
                  <div className="bg-stone-surface/30 px-4 py-2 border-b border-stone-border font-bold text-xs text-heading-charcoal">
                    Failed Records Summary ({failedLeads.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-stone-border text-[11px] text-body-brown">
                    {failedLeads.map((f, idx) => (
                      <div key={idx} className="p-3">
                        <div className="font-semibold text-heading-charcoal">{f.lead.name || 'Unnamed Lead'} ({f.lead.phone})</div>
                        <div className="text-alert-red font-medium mt-0.5">{f.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={handleReset}>Import Another Spreadsheet</Button>
              </div>
            </div>
          )}

        </div>
      </main>
    </AppShell>
  )
}
