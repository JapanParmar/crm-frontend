'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import {
  FolderKanban,
  Plus,
  Search,
  Building2,
  MapPin,
  Layers,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye,
  X,
  Grid,
  List,
  TrendingUp,
  Users,
  Calendar,
  Phone,
  Mail,
  ArrowRight,
  Image as ImageIcon,
  Upload,
  Loader2,
  FileText,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader, PageHeader } from '@/components/layout/AppHeader'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToastStore } from '@/store/useToastStore'
import { api, projectsApi, usersApi, ApiProject, ProjectCounts, CreateProjectPayload, ApiEmployee } from '@/lib/api'
import { chunkedUpload, shouldUseChunkedUpload, ChunkedUploadProgress } from '@/lib/chunkedUpload'

const columnHelper = createColumnHelper<ApiProject>()

const loadPdfJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined.'))
      return
    }
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      resolve(pdfjs)
    }
    script.onerror = () => reject(new Error('Failed to load PDF processing library.'))
    document.head.appendChild(script)
  })
}

export default function ProjectsPage() {
  const { addToast } = useToastStore()

  // State
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [counts, setCounts] = useState<ProjectCounts | null>(null)
  const [employees, setEmployees] = useState<ApiEmployee[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & View
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ApiProject | null>(null)

  // Detail Modal & Tabs
  const [detailProject, setDetailProject] = useState<ApiProject | null>(null)
  const [detailTab, setDetailTab] = useState<'specs' | 'leads' | 'visits' | 'gallery'>('specs')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<ChunkedUploadProgress | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState<CreateProjectPayload>({
    name: '',
    code: '',
    type: 'residential',
    status: 'active',
    rera_number: '',
    location: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    google_map_url: '',
    developer: '',
    budget: undefined,
    total_units: 0,
    available_units: 0,
    sold_units: 0,
    price_min: undefined,
    price_max: undefined,
    launch_date: '',
    possession_date: '',
    construction_stage: '',
    construction_pct: 0,
    description: '',
    amenities: [],

    // Excel Columns
    sr_no: '',
    project_type: '',
    project_status: '',
    passession: '',
    price: '',
    size_sqft: '',
    contact_person: '',
    contact_number: '',
    brochure_link: '',
    remarks: '',
  })
  const [amenityInput, setAmenityInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch Projects & Counts
  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await projectsApi.list({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        page,
        limit: 12,
      })
      if (res.data?.success) {
        setProjects(res.data.data)
        setTotalPages(res.data.meta?.total_pages || 1)
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to load projects.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCounts = async () => {
    try {
      const res = await projectsApi.counts()
      if (res.data?.success) {
        setCounts(res.data.data)
      }
    } catch {
      // quiet
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await usersApi.employees()
      if (res.data?.success) {
        setEmployees(res.data.data)
      }
    } catch {
      // quiet
    }
  }

  useEffect(() => {
    fetchCounts()
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [search, statusFilter, typeFilter, page])

  const fetchProjectDetails = async (projectId: number) => {
    try {
      setLoadingDetail(true)
      const res = await projectsApi.get(projectId)
      if (res.data?.success) {
        setDetailProject(res.data.data)
      }
    } catch (err: any) {
      addToast('Failed to load project details.', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!detailProject || !e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    // Reset the input so the same file can be re-selected
    e.target.value = ''

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
    const useChunked = shouldUseChunkedUpload(file)
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1)

    // ── PDF Upload Flow ──────────────────────────────────────────────
    if (isPdf) {
      try {
        setUploadingImage(true)
        setUploadProgress({ phase: 'init', percent: 0, chunksSent: 0, totalChunks: 0, message: 'Preparing PDF upload...' })

        // Upload PDF using chunked upload
        setUploadProgress({ phase: 'uploading', percent: 0, chunksSent: 0, totalChunks: 0, message: `Uploading PDF (${fileSizeMB} MB)...` })

        const pdfResult = await chunkedUpload({
          projectId: detailProject.id,
          file,
          metadata: { type: 'pdf', name: file.name },
          onProgress: (p) => setUploadProgress(p),
        })

        if (!pdfResult.success) {
          throw new Error(pdfResult.error || 'Failed to upload PDF file.')
        }

        setUploadProgress({ phase: 'complete', percent: 100, chunksSent: 0, totalChunks: 0, message: 'PDF uploaded successfully!' })
        addToast('PDF uploaded successfully!', 'success')
        await fetchProjectDetails(detailProject.id)
      } catch (err: any) {
        console.error(err)
        addToast(err.message || 'Failed to process PDF.', 'error')
      } finally {
        setUploadingImage(false)
        setTimeout(() => setUploadProgress(null), 3000)
      }

    // ── Image Upload Flow ─────────────────────────────────────────────
    } else {
      try {
        setUploadingImage(true)

        if (useChunked) {
          setUploadProgress({ phase: 'uploading', percent: 0, chunksSent: 0, totalChunks: 0, message: `Uploading image (${fileSizeMB} MB)...` })
          const result = await chunkedUpload({
            projectId: detailProject.id,
            file,
            onProgress: (p) => setUploadProgress(p),
          })
          if (!result.success) throw new Error(result.error)
        } else {
          const res = await projectsApi.uploadImage(detailProject.id, file)
          if (!res.data?.success) throw new Error('Upload failed.')
        }

        addToast('Image uploaded successfully.', 'success')
        await fetchProjectDetails(detailProject.id)
      } catch (err: any) {
        addToast(err.response?.data?.message || err.message || 'Failed to upload image.', 'error')
      } finally {
        setUploadingImage(false)
        setTimeout(() => setUploadProgress(null), 2000)
      }
    }
  }

  const handleDeleteImage = async (imageUrl: string, skipConfirm = false) => {
    if (!detailProject) return
    if (!skipConfirm && !confirm('Are you sure you want to delete this attachment?')) return
    try {
      const res = await projectsApi.deleteImage(detailProject.id, imageUrl)
      if (res.data?.success) {
        if (!skipConfirm) {
          addToast('Attachment deleted successfully.', 'success')
        }
        await fetchProjectDetails(detailProject.id)
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete attachment.', 'error')
    }
  }

  const galleryItems = useMemo(() => {
    if (!detailProject?.images) return { pdfs: [] as any[], images: [] as any[] }

    const pdfs: any[] = []
    const images: any[] = []

    detailProject.images.forEach((item) => {
      const isString = typeof item === 'string'
      const type = isString ? 'image' : item.type

      if (type === 'pdf') {
        pdfs.push(item)
      } else {
        images.push(item)
      }
    })

    return { pdfs, images }
  }, [detailProject?.images])

  // Formatting utilities
  const formatCurrency = (val?: number | null) => {
    if (!val || isNaN(val)) return '₹0'
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`
    }
    return `₹${val.toLocaleString('en-IN')}`
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <StatusBadge label="Active" bg="rgba(46, 204, 113, 0.08)" text="var(--color-grass-green)" border="rgba(46, 204, 113, 0.2)" dot />
      case 'completed':
        return <StatusBadge label="Completed" bg="rgba(52, 152, 219, 0.08)" text="var(--color-sky-blue)" border="rgba(52, 152, 219, 0.2)" dot />
      case 'on_hold':
        return <StatusBadge label="On Hold" bg="rgba(241, 196, 15, 0.08)" text="var(--color-sun-yellow)" border="rgba(241, 196, 15, 0.2)" dot />
      default:
        return <StatusBadge label={status} bg="var(--color-stone-surface)" text="var(--color-body-brown)" />
    }
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      code: '',
      type: 'residential',
      status: 'active',
      rera_number: '',
      location: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      google_map_url: '',
      developer: '',
      budget: undefined,
      total_units: 0,
      available_units: 0,
      sold_units: 0,
      price_min: undefined,
      price_max: undefined,
      launch_date: '',
      possession_date: '',
      construction_stage: '',
      construction_pct: 0,
      description: '',
      amenities: [],
      
      // Excel Columns
      sr_no: '',
      project_type: '',
      project_status: '',
      passession: '',
      price: '',
      size_sqft: '',
      contact_person: '',
      contact_number: '',
      brochure_link: '',
      remarks: '',
    })
    setIsCreateOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (project: ApiProject) => {
    setSelectedProject(project)
    setFormData({
      name: project.name,
      code: project.code,
      type: project.type,
      status: project.status,
      rera_number: project.rera_number || '',
      location: project.location || '',
      city: project.city || '',
      state: project.state || '',
      pincode: project.pincode || '',
      landmark: project.landmark || '',
      google_map_url: project.google_map_url || '',
      developer: project.developer || '',
      budget: project.budget || undefined,
      total_units: project.total_units || 0,
      available_units: project.available_units || 0,
      sold_units: project.sold_units || 0,
      price_min: project.price_min || undefined,
      price_max: project.price_max || undefined,
      launch_date: project.launch_date || '',
      possession_date: project.possession_date || '',
      construction_stage: project.construction_stage || '',
      construction_pct: project.construction_pct || 0,
      description: project.description || '',
      amenities: project.amenities || [],
      manager_id: project.manager?.id,

      // Excel Columns
      sr_no: project.sr_no || '',
      project_type: project.project_type || '',
      project_status: project.project_status || '',
      passession: project.passession || '',
      price: project.price || '',
      size_sqft: project.size_sqft || '',
      contact_person: project.contact_person || '',
      contact_number: project.contact_number || '',
      brochure_link: project.brochure_link || '',
      remarks: project.remarks || '',
    })
    setIsEditOpen(true)
  }

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities?.includes(amenityInput.trim())) {
      setFormData({
        ...formData,
        amenities: [...(formData.amenities || []), amenityInput.trim()],
      })
      setAmenityInput('')
    }
  }

  const handleRemoveAmenity = (item: string) => {
    setFormData({
      ...formData,
      amenities: (formData.amenities || []).filter((a) => a !== item),
    })
  }

  // Submit Create / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code.trim()) {
      addToast('Project Name and Code are required.', 'error')
      return
    }

    try {
      setSubmitting(true)
      if (isEditOpen && selectedProject) {
        await projectsApi.update(selectedProject.id, formData)
        addToast('Project updated successfully.', 'success')
        setIsEditOpen(false)
      } else {
        await projectsApi.create(formData)
        addToast('Project created successfully.', 'success')
        setIsCreateOpen(false)
      }
      fetchProjects()
      fetchCounts()
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Action failed. Please check inputs.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Project
  const handleDelete = async (project: ApiProject) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) return
    try {
      await projectsApi.delete(project.id)
      addToast('Project deleted successfully.', 'success')
      fetchProjects()
      fetchCounts()
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete project.', 'error')
    }
  }

  const tabs = [
    { label: 'All Projects', value: 'all', count: counts?.all },
    { label: 'Active', value: 'active', count: counts?.active },
    { label: 'Completed', value: 'completed', count: counts?.completed },
    { label: 'Under Construction', value: 'under_construction', count: counts?.under_construction },
  ]

  // Columns definition for TanStack Table
  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Project Name',
      cell: ({ row }) => {
        const proj = row.original
        return (
          <div>
            <p className="font-extrabold text-heading-charcoal">{proj.name}</p>
            <span className="block text-[10px] text-muted-gray font-normal">{proj.code}</span>
          </div>
        )
      }
    }),
    columnHelper.accessor('developer', {
      header: 'Developer',
      cell: (info) => <span className="font-medium text-body-brown">{info.getValue() || 'N/A'}</span>
    }),
    columnHelper.accessor('city', {
      header: 'Location',
      cell: ({ row }) => {
        const proj = row.original
        return (
          <span className="text-body-brown truncate max-w-[150px]">
            {proj.location ? `${proj.location}, ` : ''}{proj.city}
          </span>
        )
      }
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: (info) => <span className="capitalize font-bold text-muted-gray">{info.getValue()}</span>
    }),
    columnHelper.accessor('price_min', {
      header: 'Pricing Range',
      cell: ({ row }) => {
        const proj = row.original
        return (
          <span className="font-bold text-heading-charcoal">
            {proj.price_min ? `${formatCurrency(proj.price_min)} - ${formatCurrency(proj.price_max)}` : 'N/A'}
          </span>
        )
      }
    }),
    columnHelper.accessor('available_units', {
      header: 'Inventory',
      cell: ({ row }) => {
        const proj = row.original
        return (
          <span className="font-semibold text-heading-charcoal">
            {proj.available_units} / {proj.total_units} Left
          </span>
        )
      }
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => renderStatusBadge(info.getValue())
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const proj = row.original
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => fetchProjectDetails(proj.id)}
              className="p-1.5 rounded hover:bg-stone-surface text-body-brown hover:text-heading-charcoal transition-colors"
              title="Details & Leads Tracker"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(proj)}
              className="p-1.5 rounded hover:bg-stone-surface text-body-brown hover:text-heading-charcoal transition-colors"
              title="Edit specs"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(proj)}
              className="p-1.5 rounded hover:bg-red-50 text-alert-red transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      }
    })
  ], [employees])

  return (
    <AppShell>
      <AppHeader title="Projects Portfolio" subtitle="Manage organizational construction projects and inventories." />

      <main className="flex flex-col h-full bg-cream-canvas relative" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10 flex-shrink-0">
          <PageHeader
            tabs={tabs}
            activeTab={statusFilter}
            onTabChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
            actions={
              <div className="flex items-center gap-2">
                <Button onClick={handleOpenCreate} size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
                  New Project
                </Button>
              </div>
            }
          />

          {/* Sticky Filters Toolbar */}
          <div className="flex items-center gap-2 px-3 md:px-4 py-2.5 overflow-x-auto scrollbar-none border-t border-stone-surface bg-[#fcfbf9]">
            <div className="relative flex-shrink-0 w-[180px] sm:w-[200px] sm:flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-gray" />
              <input
                type="search"
                placeholder="Search project name, code or city..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-stone-border bg-white text-xs focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 px-2 rounded-lg border border-stone-border bg-white text-xs text-body-brown focus:outline-none focus:border-ink-black cursor-pointer flex-shrink-0"
            >
              <option value="all">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="plots">Plots / Land</option>
            </select>

            <div className="flex-1" />

            <div className="flex items-center gap-1 bg-white border border-stone-border p-1 rounded-lg flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-stone-surface text-ink-black font-bold' : 'text-body-brown hover:bg-stone-surface'
                }`}
                title="Grid view"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-stone-surface text-ink-black font-bold' : 'text-body-brown hover:bg-stone-surface'
                }`}
                title="Table view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Router */}
        {viewMode === 'grid' ? (
          /* Scrollable Page for Grid view including Stats Cards */
          <div className="flex-1 overflow-y-auto px-4 md:px-5 py-5 max-w-6xl w-full mx-auto space-y-6">
            {/* Global Key Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-cards p-6 border border-stone-surface hover:border-stone-border transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-gray text-xs font-semibold uppercase tracking-wider">
                  <span>Total Projects</span>
                  <FolderKanban className="w-4 h-4 text-brand" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-heading-charcoal">{counts?.all ?? 0}</span>
                  <span className="text-[10px] font-bold text-grass-green bg-emerald-50 px-2 py-0.5 rounded-badges">
                    Direct
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-cards p-6 border border-stone-surface hover:border-stone-border transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-gray text-xs font-semibold uppercase tracking-wider">
                  <span>Active Status</span>
                  <TrendingUp className="w-4 h-4 text-brand" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-heading-charcoal">{counts?.active ?? 0}</span>
                  <span className="text-[10px] font-bold text-grass-green bg-emerald-50 px-2 py-0.5 rounded-badges">
                    Live
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-cards p-6 border border-stone-surface hover:border-stone-border transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-gray text-xs font-semibold uppercase tracking-wider">
                  <span>Available Units</span>
                  <Building2 className="w-4 h-4 text-brand" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-heading-charcoal">{counts?.available_units ?? 0}</span>
                  <span className="text-[10px] font-bold text-body-brown bg-slate-alias/10 px-2 py-0.5 rounded-badges">
                    Inventory
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-cards p-6 border border-stone-surface hover:border-stone-border transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-muted-gray text-xs font-semibold uppercase tracking-wider">
                  <span>Sold Units</span>
                  <Layers className="w-4 h-4 text-brand" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-heading-charcoal">{counts?.sold_units ?? 0}</span>
                  <span className="text-[10px] font-bold text-body-brown bg-slate-alias/10 px-2 py-0.5 rounded-badges">
                    Inventory
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-muted-gray text-sm font-medium">Loading project inventory...</div>
            ) : projects.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-stone-border rounded-cards bg-white">
                <FolderKanban className="w-10 h-10 mx-auto text-muted-gray mb-3" />
                <h3 className="text-base font-bold text-heading-charcoal">No projects found</h3>
                <p className="text-xs text-body-brown mt-1 max-w-sm mx-auto">
                  Start adding your real estate project portfolio to track linked site visits, leads, and inventory specs.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="bg-white border border-stone-surface hover:border-stone-border transition-all rounded-cards p-6 flex flex-col justify-between shadow-sm hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-extrabold bg-stone-surface text-body-brown px-1.5 py-0.5 rounded-badges border border-stone-border">
                                {proj.code}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-muted-gray">
                                {proj.type}
                              </span>
                            </div>
                            <h3 className="text-sm font-extrabold text-heading-charcoal mt-1 leading-snug">
                              {proj.name}
                            </h3>
                          </div>
                          {renderStatusBadge(proj.status)}
                        </div>

                        <div className="bg-[#fcfbf9] border border-stone-surface rounded-xl p-3 mb-4 space-y-1">
                          <p className="text-xs font-bold text-heading-charcoal flex items-center justify-between">
                            <span>Developer:</span>
                            <span className="text-body-brown font-semibold">{proj.developer || 'N/A'}</span>
                          </p>
                        </div>

                        <div className="space-y-2 text-xs text-body-brown mb-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-gray flex-shrink-0" />
                            <span className="truncate">{proj.location ? `${proj.location}, ` : ''}{proj.city}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-muted-gray flex-shrink-0" />
                            <span>Inventory: {proj.available_units} / {proj.total_units} units available</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-surface flex items-center justify-between text-xs">
                        <span className="font-extrabold text-heading-charcoal">
                          {proj.price_min ? `${formatCurrency(proj.price_min)}+` : 'Price N/A'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => fetchProjectDetails(proj.id)}
                            className="p-1.5 rounded hover:bg-stone-surface text-body-brown hover:text-heading-charcoal transition-colors border border-transparent"
                            title="View details, linked leads and site visits"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(proj)}
                            className="p-1.5 rounded hover:bg-stone-surface text-body-brown hover:text-heading-charcoal transition-colors border border-transparent"
                            title="Edit Project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(proj)}
                            className="p-1.5 rounded hover:bg-red-50 text-alert-red transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grid Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 pb-6">
                    <span className="text-xs text-body-brown">
                      Page <span className="font-bold text-heading-charcoal">{page}</span> of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                        Previous
                      </Button>
                      <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Full Page Tabular Spreadsheet View matching Leads table */
          <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
            <DataTable
              columns={columns}
              data={projects}
              loading={loading}
              getRowId={(row) => row.id.toString()}
              pageIndex={page - 1}
              pageSize={12}
              pageCount={totalPages}
              totalCount={counts?.all ?? 0}
              onPageChange={(pIdx) => setPage(pIdx + 1)}
              onRowClick={(proj) => fetchProjectDetails(proj.id)}
              emptyTitle="No projects found"
              emptyDescription="Add your first project or adjust your filters to see results."
            />
          </div>
        )}

        {/* =================================================================== */}
        {/* MODALS */}
        {/* =================================================================== */}

        {/* Modal: Create / Edit Project */}
        <Modal
          open={isCreateOpen || isEditOpen}
          onClose={() => {
            setIsCreateOpen(false)
            setIsEditOpen(false)
          }}
          title={isEditOpen ? 'Edit Project Specifications' : 'Create New Construction Project'}
          description="Define the specs, location, units availability, budget costs, launch schedules, and amenities."
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Project Name"
                required
                placeholder="BRICKroots Residency"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Input
                label="Project Code"
                required
                placeholder="BR-RES"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />

              <Select
                label="Project Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'residential', label: 'Residential' },
                  { value: 'commercial', label: 'Commercial' },
                  { value: 'plots', label: 'Plots / Land' },
                ]}
              />

              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'on_hold', label: 'On Hold' },
                ]}
              />
            </div>

            <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 space-y-4">
              <span className="text-xs font-bold text-heading-charcoal block border-b border-stone-border pb-1.5">Excel Metadata & Contacts</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Sr. No."
                  placeholder="e.g. 1"
                  value={formData.sr_no || ''}
                  onChange={(e) => setFormData({ ...formData, sr_no: e.target.value })}
                />
                <Input
                  label="Price Description"
                  placeholder="e.g. 50 Lac Onwards"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
                <Input
                  label="Size (Sq. ft.)"
                  placeholder="e.g. 950 to 1450"
                  value={formData.size_sqft || ''}
                  onChange={(e) => setFormData({ ...formData, size_sqft: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Project Type (Excel)"
                  placeholder="e.g. 2 BHK, 3 BHK"
                  value={formData.project_type || ''}
                  onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                />
                <Input
                  label="Project Status (Excel)"
                  placeholder="e.g. Ready To Move"
                  value={formData.project_status || ''}
                  onChange={(e) => setFormData({ ...formData, project_status: e.target.value })}
                />
                <Input
                  label="Possession Date (Excel)"
                  placeholder="e.g. Dec-24"
                  value={formData.passession || ''}
                  onChange={(e) => setFormData({ ...formData, passession: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Contact Person"
                  placeholder="Contact Person Name"
                  value={formData.contact_person || ''}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
                <Input
                  label="Contact Number"
                  placeholder="Contact Mobile Number"
                  value={formData.contact_number || ''}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                <Input
                  label="Brochure Link"
                  placeholder="https://example.com/brochure.pdf"
                  value={formData.brochure_link || ''}
                  onChange={(e) => setFormData({ ...formData, brochure_link: e.target.value })}
                />
                <Input
                  label="Remarks"
                  placeholder="Enter remarks..."
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Developer"
                placeholder="BRICKroots Builders"
                value={formData.developer || ''}
                onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
              />

              <Input
                label="Location / Sector"
                placeholder="Sector 62"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />

              <Input
                label="City"
                placeholder="Noida"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="State"
                placeholder="Uttar Pradesh"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
              <Input
                label="Pincode"
                placeholder="201301"
                value={formData.pincode || ''}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
              <Input
                label="Landmark"
                placeholder="Near Sector 18 Metro"
                value={formData.landmark || ''}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              />
              <Input
                label="RERA Number"
                placeholder="UPRERAPRJ12345"
                value={formData.rera_number || ''}
                onChange={(e) => setFormData({ ...formData, rera_number: e.target.value })}
              />
            </div>

            <Input
              label="Google Maps URL"
              placeholder="https://maps.google.com/..."
              value={formData.google_map_url || ''}
              onChange={(e) => setFormData({ ...formData, google_map_url: e.target.value })}
            />

            <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 space-y-4">
              <span className="text-xs font-bold text-heading-charcoal block border-b border-stone-border pb-1.5">Construction Progress</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Construction Stage"
                  value={formData.construction_stage || ''}
                  onChange={(e) => setFormData({ ...formData, construction_stage: e.target.value })}
                  options={[
                    { value: '', label: 'Select stage...' },
                    { value: 'planning', label: 'Planning' },
                    { value: 'foundation', label: 'Foundation' },
                    { value: 'structure', label: 'Structure' },
                    { value: 'finishing', label: 'Finishing' },
                    { value: 'completed', label: 'Completed' },
                  ]}
                />
                <div>
                  <label className="block text-xs font-semibold text-heading-charcoal mb-1">
                    Completion % ({formData.construction_pct ?? 0}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={formData.construction_pct ?? 0}
                    onChange={(e) => setFormData({ ...formData, construction_pct: Number(e.target.value) })}
                    className="w-full h-2 accent-ink-black cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-gray mt-1">
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 space-y-4">
              <span className="text-xs font-bold text-heading-charcoal block border-b border-stone-border pb-1.5">Financials & Pricing Structures</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Total Project Budget (₹)"
                  type="number"
                  placeholder="150000000"
                  value={formData.budget || ''}
                  onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || undefined })}
                />
                <Input
                  label="Min Price (₹)"
                  type="number"
                  placeholder="4500000"
                  value={formData.price_min || ''}
                  onChange={(e) => setFormData({ ...formData, price_min: parseFloat(e.target.value) || undefined })}
                />
                <Input
                  label="Max Price (₹)"
                  type="number"
                  placeholder="12000000"
                  value={formData.price_max || ''}
                  onChange={(e) => setFormData({ ...formData, price_max: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 space-y-4">
              <span className="text-xs font-bold text-heading-charcoal block border-b border-stone-border pb-1.5">Unit Inventory</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Total Units"
                  type="number"
                  placeholder="250"
                  value={formData.total_units}
                  onChange={(e) => setFormData({ ...formData, total_units: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Available Units"
                  type="number"
                  placeholder="180"
                  value={formData.available_units}
                  onChange={(e) => setFormData({ ...formData, available_units: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Sold Units"
                  type="number"
                  placeholder="70"
                  value={formData.sold_units}
                  onChange={(e) => setFormData({ ...formData, sold_units: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Launch Date"
                type="date"
                value={formData.launch_date || ''}
                onChange={(e) => setFormData({ ...formData, launch_date: e.target.value })}
              />

              <Input
                label="Possession Date"
                type="date"
                value={formData.possession_date || ''}
                onChange={(e) => setFormData({ ...formData, possession_date: e.target.value })}
              />

              <Select
                label="Assigned Project Manager"
                value={formData.manager_id || ''}
                onChange={(e) => setFormData({ ...formData, manager_id: parseInt(e.target.value) || undefined })}
                options={[
                  { value: '', label: 'Select Manager...' },
                  ...employees.map((emp) => ({
                    value: emp.id.toString(),
                    label: emp.name,
                  })),
                ]}
              />
            </div>

            {/* Amenities Tag input */}
            <div>
              <label className="block text-xs font-semibold text-heading-charcoal mb-1">Amenities</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Swimming Pool, Clubhouse, Gym..."
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddAmenity()
                    }
                  }}
                  className="flex-1 h-9 px-3 rounded-inputs border border-stone-border bg-white text-xs outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black"
                />
                <Button type="button" variant="secondary" onClick={handleAddAmenity}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(formData.amenities || []).map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs bg-stone-surface border border-stone-border px-2.5 py-1 rounded-badges text-heading-charcoal font-semibold"
                  >
                    {item}
                    <button type="button" onClick={() => handleRemoveAmenity(item)} className="hover:text-alert-red font-bold">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <Textarea
              label="Description / Project Overview"
              placeholder="Enter project summary details..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-surface">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreateOpen(false)
                  setIsEditOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEditOpen ? 'Update Project' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: View Integrated Project Details & Linked Leads */}
        <Modal
          open={!!detailProject}
          onClose={() => setDetailProject(null)}
          title={detailProject?.name || ''}
          description={`${detailProject?.code} • ${detailProject?.type}`}
          size="lg"
        >
          {detailProject && (
            <div className="space-y-4 text-xs">
              {/* Sub-Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-stone-border pb-3 text-xs font-semibold">
                <button
                  onClick={() => setDetailTab('specs')}
                  className={`px-3 py-1.5 rounded-pills transition-colors flex items-center gap-1.5 border ${
                    detailTab === 'specs'
                      ? 'bg-ink-black text-white border-ink-black font-bold'
                      : 'bg-transparent text-body-brown border-transparent hover:text-ink-black hover:bg-stone-surface'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Project Specs
                </button>
                <button
                  onClick={() => setDetailTab('leads')}
                  className={`px-3 py-1.5 rounded-pills transition-colors flex items-center gap-1.5 border ${
                    detailTab === 'leads'
                      ? 'bg-ink-black text-white border-ink-black font-bold'
                      : 'bg-transparent text-body-brown border-transparent hover:text-ink-black hover:bg-stone-surface'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Associated Leads ({detailProject.leads?.length ?? 0})
                </button>
                <button
                  onClick={() => setDetailTab('visits')}
                  className={`px-3 py-1.5 rounded-pills transition-colors flex items-center gap-1.5 border ${
                    detailTab === 'visits'
                      ? 'bg-ink-black text-white border-ink-black font-bold'
                      : 'bg-transparent text-body-brown border-transparent hover:text-ink-black hover:bg-stone-surface'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Site Visits ({detailProject.site_visits?.length ?? 0})
                </button>
                <button
                  onClick={() => setDetailTab('gallery')}
                  className={`px-3 py-1.5 rounded-pills transition-colors flex items-center gap-1.5 border ${
                    detailTab === 'gallery'
                      ? 'bg-ink-black text-white border-ink-black font-bold'
                      : 'bg-transparent text-body-brown border-transparent hover:text-ink-black hover:bg-stone-surface'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Gallery ({detailProject.images?.length ?? 0})
                </button>
              </div>

              {loadingDetail ? (
                <div className="py-12 text-center text-xs text-body-brown">Loading project relationships...</div>
              ) : detailTab === 'specs' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-stone-border">
                    <div>
                      <span className="text-muted-gray block text-[10px] font-semibold uppercase">Status</span>
                      <div className="mt-1">{renderStatusBadge(detailProject.status)}</div>
                    </div>
                    <div>
                      <span className="text-muted-gray block text-[10px] font-semibold uppercase">RERA Number</span>
                      <span className="font-bold text-heading-charcoal">{detailProject.rera_number || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-stone-border">
                    <div>
                      <span className="text-muted-gray block text-[10px] font-semibold uppercase">Developer</span>
                      <span className="font-bold text-heading-charcoal">{detailProject.developer || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-gray block text-[10px] font-semibold uppercase">Location Address</span>
                      <div className="font-bold text-heading-charcoal space-y-0.5">
                        {detailProject.landmark && <span className="block text-[11px] font-normal text-muted-gray">Near {detailProject.landmark}</span>}
                        <span>
                          {detailProject.location ? `${detailProject.location}, ` : ''}
                          {detailProject.city}
                          {detailProject.state ? `, ${detailProject.state}` : ''}
                          {detailProject.pincode ? ` - ${detailProject.pincode}` : ''}
                        </span>
                        {detailProject.google_map_url && (
                          <a
                            href={detailProject.google_map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-[10px] text-sky-blue hover:underline font-semibold mt-1"
                          >
                            📍 View on Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Construction Progress */}
                  <div className="bg-white p-3 rounded-xl border border-stone-border space-y-2">
                    <span className="text-muted-gray block text-[10px] font-semibold uppercase">Construction Status</span>
                    <div className="grid grid-cols-2 gap-2 text-heading-charcoal font-semibold mb-2">
                      <div className="capitalize">Stage: {detailProject.construction_stage || 'Planning'}</div>
                      <div className="text-right">Progress: {detailProject.construction_pct ?? 0}%</div>
                    </div>
                    <div className="w-full bg-stone-surface rounded-full h-2 overflow-hidden border border-stone-border">
                      <div 
                        className="bg-ink-black h-full transition-all duration-500" 
                        style={{ width: `${detailProject.construction_pct ?? 0}%` }} 
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-stone-border">
                    <div>
                      <span className="text-muted-gray block text-[10px] font-semibold uppercase">Launch Date</span>
                      <span className="font-bold text-heading-charcoal">{detailProject.launch_date || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-gray block text-[10px] font-semibold uppercase">Possession Date</span>
                      <span className="font-bold text-heading-charcoal">{detailProject.possession_date || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-stone-border space-y-2">
                    <span className="text-muted-gray block text-[10px] font-semibold uppercase">Pricing & Budget</span>
                    <div className="grid grid-cols-2 gap-2 text-heading-charcoal font-semibold">
                      <div>Price Range: {formatCurrency(detailProject.price_min)} - {formatCurrency(detailProject.price_max)}</div>
                      <div>Total Budget: {formatCurrency(detailProject.budget)}</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-stone-border space-y-2">
                    <span className="text-muted-gray block text-[10px] font-semibold uppercase">Units Overview</span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-stone-surface rounded-lg">
                        <span className="block text-[10px] text-muted-gray">Total</span>
                        <span className="font-bold text-heading-charcoal text-sm">{detailProject.total_units}</span>
                      </div>
                      <div className="p-2 bg-stone-surface rounded-lg">
                        <span className="block text-[10px] text-muted-gray">Available</span>
                        <span className="font-bold text-heading-charcoal text-sm">{detailProject.available_units}</span>
                      </div>
                      <div className="p-2 bg-stone-surface rounded-lg">
                        <span className="block text-[10px] text-muted-gray">Sold</span>
                        <span className="font-bold text-heading-charcoal text-sm">{detailProject.sold_units}</span>
                      </div>
                    </div>
                  </div>

                  {/* Excel Sheet Metadata Card */}
                  <div className="bg-[#fcfbf9] border border-stone-surface rounded-cards p-4 grid grid-cols-2 gap-3.5">
                    <div><span className="text-muted-gray text-[9px] uppercase font-bold">Sr. No.</span><p className="font-bold text-heading-charcoal mt-0.5">{detailProject.sr_no || 'N/A'}</p></div>
                    <div><span className="text-muted-gray text-[9px] uppercase font-bold">Project Type (Excel)</span><p className="font-bold text-heading-charcoal mt-0.5">{detailProject.project_type || 'N/A'}</p></div>
                    <div><span className="text-muted-gray text-[9px] uppercase font-bold">Project Status (Excel)</span><p className="font-bold text-heading-charcoal mt-0.5">{detailProject.project_status || 'N/A'}</p></div>
                    <div><span className="text-muted-gray text-[9px] uppercase font-bold">Possession (Excel)</span><p className="font-bold text-heading-charcoal mt-0.5">{detailProject.passession || 'N/A'}</p></div>
                    <div><span className="text-muted-gray text-[9px] uppercase font-bold">Price Range (Excel)</span><p className="font-bold text-heading-charcoal mt-0.5">{detailProject.price || 'N/A'}</p></div>
                    <div><span className="text-muted-gray text-[9px] uppercase font-bold">Size Sq. Ft.</span><p className="font-bold text-heading-charcoal mt-0.5">{detailProject.size_sqft || 'N/A'}</p></div>
                    <div><span className="text-muted-gray text-[9px] uppercase font-bold">Contact Person</span><p className="font-bold text-heading-charcoal mt-0.5">{detailProject.contact_person || 'N/A'}</p></div>
                    <div><span className="text-muted-gray text-[9px] uppercase font-bold">Contact Number</span><p className="font-bold text-heading-charcoal mt-0.5">{detailProject.contact_number || 'N/A'}</p></div>
                    {detailProject.brochure_link && (
                      <div className="col-span-2">
                        <span className="text-muted-gray text-[9px] uppercase font-bold">Brochure Link</span>
                        <p className="font-bold text-heading-charcoal mt-0.5">
                          <a href={detailProject.brochure_link} target="_blank" rel="noopener noreferrer" className="text-sky-blue hover:underline">
                            Download / View Brochure ↗
                          </a>
                        </p>
                      </div>
                    )}
                    {detailProject.remarks && (
                      <div className="col-span-2">
                        <span className="text-muted-gray text-[9px] uppercase font-bold">Remarks</span>
                        <p className="italic text-body-brown mt-0.5">{detailProject.remarks}</p>
                      </div>
                    )}
                  </div>

                  {detailProject.amenities && detailProject.amenities.length > 0 && (
                    <div>
                      <span className="text-body-brown font-semibold block mb-2">Amenities</span>
                      <div className="flex flex-wrap gap-1.5">
                        {detailProject.amenities.map((a, i) => (
                          <span key={i} className="bg-white border border-stone-border px-2.5 py-1 rounded-badges text-heading-charcoal font-semibold">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailProject.description && (
                    <div>
                      <span className="text-body-brown font-semibold block mb-1">Description</span>
                      <p className="p-3 bg-white border border-stone-border rounded-xl text-body-brown leading-relaxed">
                        {detailProject.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : detailTab === 'leads' ? (
                /* Associated Leads Tab */
                <div className="space-y-3">
                  {!detailProject.leads || detailProject.leads.length === 0 ? (
                    <div className="py-12 text-center text-xs text-body-brown bg-white border border-dashed border-stone-border rounded-xl">
                      No leads are currently assigned to {detailProject.name}.
                    </div>
                  ) : (
                    detailProject.leads.map((ld: any) => (
                      <div
                        key={ld.id}
                        className="bg-white border border-stone-border rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-heading-charcoal">{ld.name}</span>
                            <span className="text-[10px] bg-stone-surface px-1.5 py-0.5 rounded-badges border border-stone-border text-body-brown">
                              {ld.lead_number}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-grass-green bg-emerald-50 px-1.5 py-0.5 rounded-badges">
                              {ld.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-body-brown">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted-gray" /> {ld.phone}</span>
                            {ld.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-muted-gray" /> {ld.email}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-muted-gray block">Assigned To</span>
                          <span className="font-semibold text-heading-charcoal">{ld.assigned_to?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : detailTab === 'visits' ? (
                /* Site Visits Tab */
                <div className="space-y-3">
                  {!detailProject.site_visits || detailProject.site_visits.length === 0 ? (
                    <div className="py-12 text-center text-xs text-body-brown bg-white border border-dashed border-stone-border rounded-xl">
                      No site visits logged for {detailProject.name}.
                    </div>
                  ) : (
                    detailProject.site_visits.map((sv: any) => (
                      <div
                        key={sv.id}
                        className="bg-white border border-stone-border rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-heading-charcoal">{sv.lead?.name || 'Lead Visit'}</p>
                          <p className="text-[11px] text-muted-gray mt-0.5">
                            {new Date(sv.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-sky-blue bg-blue-50 px-2.5 py-0.5 rounded-badges">
                          {sv.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Gallery Tab */
                <div className="space-y-4">
                  {/* Upload action */}
                  <div className="p-3 bg-stone-surface rounded-xl border border-stone-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-body-brown block">Project Attachments Gallery</span>
                        <span className="text-[10px] text-muted-gray">Upload images or PDFs (up to 100MB). PDFs are automatically split into page-by-page previews.</span>
                      </div>
                      <label className="relative flex items-center gap-2 cursor-pointer bg-ink-black hover:bg-ink-black/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0">
                        {uploadingImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingImage ? 'Processing...' : 'Upload Image / PDF'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleUploadImage}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Upload Progress Bar */}
                    {uploadProgress && (
                      <div className="space-y-1.5 animate-in fade-in">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-body-brown font-semibold flex items-center gap-1.5">
                            {uploadProgress.phase === 'error' ? (
                              <span className="text-alert-red">✕ Upload failed</span>
                            ) : uploadProgress.phase === 'complete' ? (
                              <span className="text-grass-green">✓ Upload complete</span>
                            ) : (
                              <><Loader2 className="w-3 h-3 animate-spin" /> {uploadProgress.message}</>
                            )}
                          </span>
                          <span className="text-muted-gray font-bold">{uploadProgress.percent}%</span>
                        </div>
                        <div className="w-full h-2 bg-stone-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${
                              uploadProgress.phase === 'error'
                                ? 'bg-alert-red'
                                : uploadProgress.phase === 'complete'
                                ? 'bg-grass-green'
                                : uploadProgress.phase === 'extracting'
                                ? 'bg-sky-blue'
                                : 'bg-ink-black'
                            }`}
                            style={{ width: `${uploadProgress.percent}%` }}
                          />
                        </div>
                        {uploadProgress.phase === 'uploading' && uploadProgress.totalChunks > 1 && (
                          <p className="text-[9px] text-muted-gray">
                            Chunk {uploadProgress.chunksSent} / {uploadProgress.totalChunks}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {!detailProject.images || detailProject.images.length === 0 ? (
                    <div className="py-16 text-center text-xs text-body-brown bg-white border border-dashed border-stone-border rounded-xl flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-8 h-8 text-muted-gray" />
                      <span>No images or PDF files uploaded for this project yet.</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* PDF Documents Section */}
                      {galleryItems.pdfs.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block">PDF Documents ({galleryItems.pdfs.length})</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {galleryItems.pdfs.map((item: any, i: number) => {
                              const url = typeof item === 'string' ? item : item.url
                              const name = typeof item === 'string' ? `Document ${i + 1}` : (item.name || `Document ${i + 1}`)
                              const size = typeof item !== 'string' && item.size ? `${(item.size / 1024 / 1024).toFixed(1)} MB` : null

                              return (
                                <div
                                  key={i}
                                  className="bg-white border border-stone-border rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-bold text-heading-charcoal truncate" title={name}>{name}</p>
                                      <p className="text-[9px] text-muted-gray mt-0.5">
                                        PDF Document{size ? ` • ${size}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-surface">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 bg-stone-surface hover:bg-stone-border border border-stone-border text-center text-heading-charcoal text-[10px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                    >
                                      <Eye className="w-3 h-3" /> View
                                    </a>
                                    <a
                                      href={url}
                                      download={name}
                                      className="flex-1 bg-ink-black hover:bg-ink-black/90 text-white text-center text-[10px] font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                    >
                                      <FileText className="w-3 h-3" /> Download
                                    </a>
                                    <button
                                      onClick={() => handleDeleteImage(url)}
                                      className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer border border-red-100 shrink-0"
                                      title="Delete Document"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Images Section */}
                      {galleryItems.images.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block">Images ({galleryItems.images.length})</span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {galleryItems.images.map((item: any, i: number) => {
                              const isString = typeof item === 'string'
                              const url = isString ? item : item.url
                              const name = isString ? `Image ${i + 1}` : item.name

                              return (
                                <div
                                  key={i}
                                  className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-stone-border bg-stone-surface"
                                >
                                  <img
                                    src={url}
                                    alt={name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  {/* Hover Overlay */}
                                  <div className="absolute inset-0 bg-ink-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                      onClick={() => setLightboxUrl(url)}
                                      className="p-2 bg-white text-ink-black rounded-full hover:bg-stone-surface transition-colors cursor-pointer"
                                      title="Zoom"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteImage(url)}
                                      className="p-2 bg-alert-red text-white rounded-full hover:bg-alert-red/90 transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-3">
                <Button variant="secondary" onClick={() => setDetailProject(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Lightbox Modal */}
        <Modal
          open={!!lightboxUrl}
          onClose={() => setLightboxUrl(null)}
          title="Project Image View"
          size="lg"
        >
          {lightboxUrl && (
            <div className="flex flex-col items-center justify-center p-2 relative bg-black rounded-lg overflow-hidden">
              <img 
                src={lightboxUrl} 
                alt="Project Full View" 
                className="max-h-[70vh] max-w-full object-contain rounded-md"
              />
              <button
                onClick={() => setLightboxUrl(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </Modal>
      </main>
    </AppShell>
  )
}
