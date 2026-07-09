import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'

// ---------------------------------------------------------------------------
// Axios instance — single source of truth for all API calls
// ---------------------------------------------------------------------------
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
})

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('crm_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-redirect to /login on 401, show errors on failures
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined') {
      const isLoginRequest = error.config?.url?.endsWith('/login') || error.config?.url?.includes('/login')

      if (error.response?.status === 401) {
        if (isLoginRequest) {
          // If login failed, show the specific credentials/error toast
          const msg = error.response?.data?.message || 'Invalid email or password.'
          useToastStore.getState().addToast(msg, 'error')
        } else {
          // Clear session and redirect to login
          useAuthStore.getState().clearAuth()
          window.location.href = '/login'
        }
      } else {
        // Handle all other API failures globally
        let msg = ''
        if (!error.response) {
          // Network or server offline error
          if (error.code === 'ECONNABORTED') {
            msg = 'Connection timeout. Please check your internet connection and try again.'
          } else {
            msg = 'Network error: Cannot connect to the API server. Please check if the server is running.'
          }
        } else {
          const { status, data } = error.response
          
          if (status === 422 && data) {
            // Validation errors
            if (data.errors && typeof data.errors === 'object') {
              const validationMessages = Object.values(data.errors)
                .flat()
                .join(' ')
              msg = validationMessages || data.message || 'Validation error. Please verify the input values.'
            } else {
              msg = data.message || 'Validation error. Please verify the input values.'
            }
          } else if (status === 403) {
            msg = data?.message || 'Access denied: You do not have permission to perform this action.'
          } else if (status === 404) {
            msg = data?.message || 'Resource not found.'
          } else if (status >= 500) {
            msg = data?.message || 'Server error: Something went wrong on the server. Please try again later.'
          } else {
            msg = data?.message || `Request failed with status code ${status}.`
          }
        }

        useToastStore.getState().addToast(msg, 'error')
      }
    }
    return Promise.reject(error)
  }
)

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/login', { email, password }),

  me: () => api.get<ApiSuccessResponse<AuthUser>>('/me'),

  logout: () => api.post('/logout'),
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export const dashboardApi = {
  get: (params?: { date_from?: string; date_to?: string }) => api.get<ApiSuccessResponse<DashboardData>>('/dashboard', { params }),
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
export const leadsApi = {
  list: (params?: LeadListParams) =>
    api.get<PaginatedApiResponse<ApiLead>>('/leads', { params }),

  counts: () => api.get<ApiSuccessResponse<LeadCounts>>('/leads/counts'),

  get: (id: number | string) =>
    api.get<ApiSuccessResponse<ApiLead>>(`/leads/${id}`),

  create: (data: CreateLeadPayload) =>
    api.post<ApiSuccessResponse<ApiLead>>('/leads', data),

  update: (id: number | string, data: Partial<CreateLeadPayload>) =>
    api.patch<ApiSuccessResponse<ApiLead>>(`/leads/${id}`, data),

  delete: (id: number | string) => api.delete(`/leads/${id}`),

  followUps: (id: number | string) =>
    api.get<ApiSuccessResponse<ApiFollowUp[]>>(`/leads/${id}/follow-ups`),

  siteVisits: (id: number | string) =>
    api.get<ApiSuccessResponse<ApiSiteVisit[]>>(`/leads/${id}/site-visits`),

  activity: (id: number | string) =>
    api.get<ApiSuccessResponse<ApiActivity[]>>(`/leads/${id}/activity`),

  bulkAssign: (data: { lead_ids: number[]; assigned_to: number | null }) =>
    api.patch<ApiSuccessResponse<void>>('/leads/bulk-assign', data),

  checkDuplicates: (data: { leads: { phone?: string; email?: string }[] }) =>
    api.post<ApiSuccessResponse<{
      phone?: string
      email?: string
      is_duplicate: boolean
      lead_id?: number
      lead_number?: string
      lead_name?: string
    }[]>>('/leads/check-duplicates', data),
}

// ---------------------------------------------------------------------------
// Follow-ups
// ---------------------------------------------------------------------------
export const followUpsApi = {
  list: (params?: FollowUpListParams) =>
    api.get<PaginatedApiResponse<ApiFollowUp>>('/follow-ups', { params }),

  counts: () =>
    api.get<ApiSuccessResponse<FollowUpCounts>>('/follow-ups/counts'),

  schedule: (leadId: number | string, data: ScheduleFollowUpPayload) =>
    api.post<ApiSuccessResponse<ApiFollowUp>>(`/leads/${leadId}/follow-ups`, data),

  complete: (id: number | string, data: { outcome?: string; notes?: string }) =>
    api.patch<ApiSuccessResponse<ApiFollowUp>>(`/follow-ups/${id}/complete`, data),

  miss: (id: number | string) =>
    api.patch<ApiSuccessResponse<ApiFollowUp>>(`/follow-ups/${id}/miss`),
}

// ---------------------------------------------------------------------------
// Site Visits
// ---------------------------------------------------------------------------
export const siteVisitsApi = {
  list: (params?: SiteVisitListParams) =>
    api.get<PaginatedApiResponse<ApiSiteVisit>>('/site-visits', { params }),

  counts: () =>
    api.get<ApiSuccessResponse<SiteVisitCounts>>('/site-visits/counts'),

  schedule: (leadId: number | string, data: ScheduleSiteVisitPayload) =>
    api.post<ApiSuccessResponse<ApiSiteVisit>>(`/leads/${leadId}/site-visits`, data),

  complete: (id: number | string, data: { feedback?: string; interested: boolean; notes?: string }) =>
    api.patch<ApiSuccessResponse<ApiSiteVisit>>(`/site-visits/${id}/complete`, data),
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const usersApi = {
  list: (params?: { role?: string; active?: boolean; search?: string }) =>
    api.get<ApiSuccessResponse<ApiUserWithStats[]>>('/users', { params }),

  employees: () =>
    api.get<ApiSuccessResponse<ApiEmployee[]>>('/users/employees'),

  get: (id: number | string) =>
    api.get<ApiSuccessResponse<ApiUserWithStats>>(`/users/${id}`),

  create: (data: CreateUserPayload) =>
    api.post<ApiSuccessResponse<ApiUserWithStats>>('/users', data),

  update: (id: number | string, data: Partial<CreateUserPayload>) =>
    api.patch<ApiSuccessResponse<ApiUserWithStats>>(`/users/${id}`, data),
}

// ---------------------------------------------------------------------------
// RBAC (Roles & Permissions)
// ---------------------------------------------------------------------------
export interface ApiRole {
  id: number
  name: string
  permissions: string[]
}

export const rbacApi = {
  getRoles: () => api.get<ApiSuccessResponse<ApiRole[]>>('/rbac/roles'),
  createRole: (data: { name: string }) => api.post<ApiSuccessResponse<ApiRole>>('/rbac/roles', data),
  getPermissions: () => api.get<ApiSuccessResponse<string[]>>('/rbac/permissions'),
  syncPermissions: (roleId: number | string, permissions: string[]) =>
    api.patch<ApiSuccessResponse<ApiRole>>(`/rbac/roles/${roleId}/permissions`, { permissions }),
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------
export const activityApi = {
  list: (params?: { type?: string; lead_id?: number; limit?: number; page?: number }) =>
    api.get<PaginatedApiResponse<ApiActivity>>('/activity', { params }),
}

// ===========================================================================
// API Response Types — must match exactly what Laravel returns
// ===========================================================================

export interface ApiSuccessResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedApiResponse<T> {
  success: boolean
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    token_type: string
    expires_in: number
    user: AuthUser
  }
}

export interface AuthUser {
  id: number
  name: string
  email: string
  phone: string | null
  is_active: number | boolean
  roles: string[]
  permissions: string[]
  access: AccessFlags
}

export interface AccessFlags {
  dashboard: boolean
  leads: boolean
  all_leads: boolean
  my_leads: boolean
  import_leads: boolean
  assign_leads: boolean
  follow_ups: boolean
  site_visits: boolean
  users: boolean
  activity_log: boolean
  settings: boolean
  rbac?: boolean
}

export interface ApiLead {
  leadNumber: any
  id: number
  lead_number: string
  name: string
  phone: string
  alternate_phone: string | null
  email: string | null
  lead_date: string | null
  source: string
  service_type: string | null
  status: string
  priority: string
  property_type: string | null
  budget_min: number | null
  budget_max: number | null
  preferred_location: string | null
  city: string | null
  locality: string | null
  project_interest: string | null
  bhk_preference: string | null
  listing_id: string | null
  lead_provider_ref: string | null
  score: number
  notes: string | null
  tags: string[]
  assigned_to: { id: number; name: string; email: string } | null
  is_duplicate: boolean
  follow_up_count: number
  site_visit_count: number
  last_contacted_at: string | null
  next_follow_up_at: string | null
  assigned_at: string | null
  created_at: string
  updated_at: string
}

export interface ApiFollowUp {
  id: number
  lead_id: number
  lead: { id: number; name: string; phone: string } | null
  assigned_to: { id: number; name: string } | null
  type: string
  status: string
  scheduled_at: string
  completed_at: string | null
  notes: string | null
  outcome: string | null
  created_at: string
}

export interface ApiSiteVisit {
  id: number
  lead_id: number
  lead: { id: number; name: string; phone: string } | null
  attended_by: { id: number; name: string } | null
  project_name: string
  location: string | null
  status: string
  scheduled_at: string
  completed_at: string | null
  notes: string | null
  feedback: string | null
  interested: boolean | null
  created_at: string
}

export interface ApiActivity {
  id: number
  lead_id: number | null
  type: string
  description: string
  metadata: Record<string, unknown> | null
  performed_by: { id: number; name: string } | null
  created_at: string
}

export interface ApiUserWithStats {
  id: number
  name: string
  email: string
  phone: string | null
  is_active: boolean
  roles: string[]
  assigned_leads: number
  closed_deals: number
  pending_follow_ups: number
  created_at: string
}

export interface ApiEmployee {
  id: number
  name: string
  email: string
  phone: string | null
}

export interface DashboardData {
  role: 'admin' | 'employee'
  stats: AdminStats | EmployeeStats
  today_schedule: TodayScheduleItem[]
  team?: TeamMemberStat[]
}

export interface MonthlyTrendItem {
  month: string
  key: string
  leads: number
  closed_won: number
}

export interface AdminStats {
  total_leads: number
  assigned_leads: number
  unassigned_leads: number
  new_leads: number
  new_today: number
  active_leads: number
  closed_won: number
  closed_lost: number
  conversion_rate: number
  pending_follow_ups: number
  overdue_follow_ups: number
  today_follow_ups: number
  missed_follow_ups: number
  today_site_visits: number
  active_employees: number
  cold_leads: number
  leads_by_source: Record<string, number>
  leads_by_status: Record<string, number>
  leads_by_service_type: Record<string, number>
  leads_by_city: Record<string, number>
  leads_by_property_type: Record<string, number>
  leads_by_bhk: Record<string, number>
  monthly_trend: MonthlyTrendItem[]
}

export interface EmployeeStats {
  my_leads: number
  my_pending_follow_ups: number
  my_overdue_follow_ups: number
  my_today_follow_ups: number
  my_today_site_visits: number
  my_closed_won: number
}

export interface TodayScheduleItem {
  id: number
  lead_id: number
  lead_name: string | null
  phone: string | null
  type: string
  status: string
  scheduled_at: string
  notes: string | null
  assigned_to_id: number
  assigned_to_name: string | null
}

export interface TeamMemberStat {
  id: number
  name: string
  email: string
  assigned_leads: number
  closed_deals: number
  conversion_rate: number
  pending_follow_ups: number
}

export interface LeadCounts {
  all: number
  my: number
  unassigned: number
  today: number
}

export interface FollowUpCounts {
  today: number
  upcoming: number
  overdue: number
  missed: number
  completed: number
  all: number
}

export interface SiteVisitCounts {
  all: number
  scheduled: number
  completed: number
  no_show: number
  cancelled: number
}

// ---------------------------------------------------------------------------
// Payload Types
// ---------------------------------------------------------------------------
export interface LeadListParams {
  search?: string
  status?: string
  source?: string
  priority?: string
  assigned_to?: string
  tab?: 'all' | 'my' | 'unassigned' | 'today'
  date_from?: string
  date_to?: string
  budget_min?: number
  budget_max?: number
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  limit?: number
  page?: number
}

export interface FollowUpListParams {
  tab?: 'today' | 'upcoming' | 'overdue' | 'missed' | 'completed' | 'all'
  type?: string
  search?: string
  limit?: number
  page?: number
}

export interface SiteVisitListParams {
  status?: string
  search?: string
  limit?: number
  page?: number
}

export interface CreateLeadPayload {
  name: string
  phone: string
  alternate_phone?: string
  email?: string
  lead_date?: string
  source: string
  service_type?: string
  status?: string
  priority?: string
  property_type?: string
  budget_min?: number
  budget_max?: number
  preferred_location?: string
  city?: string
  locality?: string
  project_interest?: string
  bhk_preference?: string
  listing_id?: string
  lead_provider_ref?: string
  notes?: string
  assigned_to?: number
}

export interface ScheduleFollowUpPayload {
  type: string
  scheduled_at: string
  notes?: string
  assigned_to?: number
}

export interface ScheduleSiteVisitPayload {
  project_name: string
  location?: string
  scheduled_at: string
  attended_by?: number
  notes?: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password?: string
  phone?: string
  role: string
  is_active?: boolean
}
