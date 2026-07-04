// Lead Types
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'site_visit'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'on_hold'

export type LeadSource =
  | 'magicbricks'
  | '99acres'
  | 'housing'
  | 'meta_ads'
  | 'google_ads'
  | 'website'
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'referral'
  | 'walk_in'
  | 'property_portal'

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent'

export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'plot'
  | 'commercial'
  | 'penthouse'
  | 'studio'
  | 'duplex'

export interface Lead {
  id: string
  leadNumber: string
  name: string
  phone: string
  alternatePhone?: string
  email?: string
  source: LeadSource
  status: LeadStatus
  priority: LeadPriority
  propertyType?: PropertyType
  budget?: number
  budgetMax?: number
  location?: string
  projectInterest?: string
  assignedTo?: string
  assignedToName?: string
  score: number
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  lastContactedAt?: string
  nextFollowUp?: string
  siteVisitCount: number
  followUpCount: number
  isDuplicate?: boolean
}

// Follow-up Types
export type FollowUpType = 'call' | 'whatsapp' | 'email' | 'meeting' | 'site_visit'
export type FollowUpStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled'

export interface FollowUp {
  id: string
  leadId: string
  leadName: string
  type: FollowUpType
  status: FollowUpStatus
  scheduledAt: string
  completedAt?: string
  notes?: string
  outcome?: string
  assignedTo: string
  assignedToName: string
  createdAt: string
}

// Site Visit Types
export type SiteVisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface SiteVisit {
  id: string
  leadId: string
  leadName: string
  projectName: string
  scheduledAt: string
  completedAt?: string
  status: SiteVisitStatus
  attendedBy: string
  attendedByName: string
  feedback?: string
  interested?: boolean
  notes?: string
  createdAt: string
}

// User Types
export type UserRole = 'admin' | 'sales_manager' | 'sales_executive'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatar?: string
  isActive: boolean
  assignedLeads: number
  closedDeals: number
  createdAt: string
}

// Activity Types
export type ActivityType =
  | 'lead_created'
  | 'status_changed'
  | 'follow_up_scheduled'
  | 'follow_up_completed'
  | 'site_visit_scheduled'
  | 'site_visit_completed'
  | 'note_added'
  | 'document_added'
  | 'assigned'
  | 'call_made'
  | 'email_sent'
  | 'whatsapp_sent'

export interface Activity {
  id: string
  leadId: string
  type: ActivityType
  description: string
  metadata?: Record<string, unknown>
  performedBy: string
  performedByName: string
  createdAt: string
}

// KPI Types
export interface KPIStats {
  totalLeads: number
  newLeads: number
  activeLeads: number
  closedWon: number
  closedLost: number
  conversionRate: number
  pendingFollowUps: number
  todayFollowUps: number
  scheduledSiteVisits: number
  revenue: number
  averageScore: number
  leadsBySource: Record<LeadSource, number>
  leadsByStatus: Record<LeadStatus, number>
}

// Filter Types
export interface LeadFilters {
  search?: string
  status?: LeadStatus[]
  source?: LeadSource[]
  priority?: LeadPriority[]
  assignedTo?: string[]
  dateFrom?: string
  dateTo?: string
  budgetMin?: number
  budgetMax?: number
  propertyType?: PropertyType[]
}

// Pagination
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// API Response
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}
