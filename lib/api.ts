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

  updatePreferences: (preferences: Record<string, any>) =>
    api.put<ApiSuccessResponse<Record<string, any>>>('/me/preferences', { preferences }),

  logout: () => api.post('/logout'),

  uploadProfileImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post<ApiSuccessResponse<AuthUser>>('/me/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
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

  delete: (id: number | string, permanent?: boolean) => api.delete(`/leads/${id}`, { params: { permanent } }),

  bulkDelete: (data: { lead_ids: number[]; permanent?: boolean }) => api.delete('/leads/bulk-delete', { data }),

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

  accept: (id: number | string) =>
    api.post<ApiSuccessResponse<ApiLead>>(`/leads/${id}/accept`),

  reject: (id: number | string) =>
    api.post<ApiSuccessResponse<{ reassigned_to: string | null }>>(`/leads/${id}/reject`),
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

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const projectsApi = {
  list: (params?: ProjectListParams) =>
    api.get<PaginatedApiResponse<ApiProject>>('/projects', { params }),

  counts: () => api.get<ApiSuccessResponse<ProjectCounts>>('/projects/counts'),

  get: (id: number | string) =>
    api.get<ApiSuccessResponse<ApiProject>>(`/projects/${id}`),

  create: (data: CreateProjectPayload) =>
    api.post<ApiSuccessResponse<ApiProject>>('/projects', data),

  update: (id: number | string, data: Partial<CreateProjectPayload>) =>
    api.patch<ApiSuccessResponse<ApiProject>>(`/projects/${id}`, data),

  delete: (id: number | string) => api.delete(`/projects/${id}`),

  uploadImage: (
    id: number | string,
    file: File,
    metadata?: { type?: 'image' | 'pdf' | 'pdf_page'; pdf_url?: string; pdf_name?: string; page_number?: number; name?: string }
  ) => {
    const formData = new FormData()
    formData.append('image', file)
    if (metadata) {
      if (metadata.type) formData.append('type', metadata.type)
      if (metadata.pdf_url) formData.append('pdf_url', metadata.pdf_url)
      if (metadata.pdf_name) formData.append('pdf_name', metadata.pdf_name)
      if (metadata.page_number) formData.append('page_number', String(metadata.page_number))
      if (metadata.name) formData.append('name', metadata.name)
    }
    return api.post<ApiSuccessResponse<ApiProject>>(`/projects/${id}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  deleteImage: (id: number | string, imageUrl: string) =>
    api.post<ApiSuccessResponse<ApiProject>>(`/projects/${id}/delete-image`, { url: imageUrl }),
}

// ---------------------------------------------------------------------------
// HR Employees
// ---------------------------------------------------------------------------
export const employeesApi = {
  list: (params?: EmployeeListParams) =>
    api.get<PaginatedApiResponse<ApiHREmployee>>('/employees', { params }),

  stats: () => api.get<ApiSuccessResponse<HREmployeeStats>>('/employees/stats'),

  get: (id: number | string) =>
    api.get<ApiSuccessResponse<ApiHREmployee>>(`/employees/${id}`),

  create: (data: CreateHREmployeePayload) =>
    api.post<ApiSuccessResponse<ApiHREmployee>>('/employees', data),

  update: (id: number | string, data: Partial<CreateHREmployeePayload>) =>
    api.patch<ApiSuccessResponse<ApiHREmployee>>(`/employees/${id}`, data),

  delete: (id: number | string) => api.delete(`/employees/${id}`),

  uploadImage: (id: number | string, file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post<ApiSuccessResponse<ApiHREmployee>>(`/employees/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ---------------------------------------------------------------------------
// HRM System (Attendance, Leaves, Payroll)
// ---------------------------------------------------------------------------
export const hrmApi = {
  todayAttendance: () =>
    api.get<ApiSuccessResponse<{ has_employee_profile: boolean; employee?: ApiHREmployee; attendance: ApiAttendance | null }>>('/hrm/attendance/today'),

  clockIn: (notes?: string, latitude?: number, longitude?: number) =>
    api.post<ApiSuccessResponse<ApiAttendance>>('/hrm/attendance/clock-in', { notes, latitude, longitude }),

  clockOut: () =>
    api.post<ApiSuccessResponse<ApiAttendance>>('/hrm/attendance/clock-out'),

  attendances: (params?: { employee_id?: number; status?: string; date?: string; page?: number; limit?: number }) =>
    api.get<PaginatedApiResponse<ApiAttendance>>('/hrm/attendances', { params }),

  leaves: (params?: { employee_id?: number; status?: string; page?: number; limit?: number }) =>
    api.get<PaginatedApiResponse<ApiLeave>>('/hrm/leaves', { params }),

  applyLeave: (data: { leave_type: string; start_date: string; end_date: string; reason: string }) =>
    api.post<ApiSuccessResponse<ApiLeave>>('/hrm/leaves', data),

  updateLeaveStatus: (id: number | string, data: { status: 'approved' | 'rejected' | 'pending'; admin_notes?: string }) =>
    api.patch<ApiSuccessResponse<ApiLeave>>(`/hrm/leaves/${id}/status`, data),

  payrolls: (params?: { employee_id?: number; month?: number; year?: number; page?: number; limit?: number }) =>
    api.get<PaginatedApiResponse<ApiPayroll>>('/hrm/payrolls', { params }),

  processPayroll: (data: { month: number; year: number }) =>
    api.post<ApiSuccessResponse<any>>('/hrm/payrolls/process', data),
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
  preferences?: Record<string, any> | null
  roles: string[]
  permissions: string[]
  access: AccessFlags
  profile_image?: string | null
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
  projects?: boolean
  hr?: boolean
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
  project_id?: number | null
  project?: ApiProject | null
  assigned_to: { id: number; name: string; email: string } | null
  assignment_status?: 'pending' | 'accepted' | 'rejected' | 'expired' | null
  accepted_at?: string | null
  sla_expires_at?: string | null
  reassigned_from?: number | null
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

// ---------------------------------------------------------------------------
// Projects Types
// ---------------------------------------------------------------------------
export type ProjectImageItem = string | {
  url: string
  type: 'image' | 'pdf' | 'pdf_page'
  name: string
  pdf_url?: string
  pdf_name?: string
  page_number?: number
}
export interface ApiProject {
  id: number
  name: string
  code: string
  type: 'residential' | 'commercial' | 'mixed_use' | 'industrial' | 'plot'
  status: 'planning' | 'active' | 'under_construction' | 'completed' | 'on_hold'
  rera_number: string | null
  location: string | null
  city: string | null
  state: string | null
  pincode: string | null
  landmark: string | null
  google_map_url: string | null
  developer: string | null
  budget: number | null
  total_units: number
  available_units: number
  sold_units: number
  price_min: number | null
  price_max: number | null
  launch_date: string | null
  possession_date: string | null
  construction_stage: string | null
  construction_pct: number
  description: string | null
  amenities: string[] | null
  manager: { id: number; name: string; email: string } | null
  created_by: { id: number; name: string } | null
  images?: ProjectImageItem[] | null
  leads?: ApiLead[]
  site_visits?: ApiSiteVisit[]
  created_at: string
  updated_at: string
  
  // Excel Columns
  sr_no?: string | null
  project_type?: string | null
  project_status?: string | null
  passession?: string | null
  price?: string | null
  size_sqft?: string | null
  contact_person?: string | null
  contact_number?: string | null
  brochure_link?: string | null
  remarks?: string | null
}

export interface ProjectCounts {
  all: number
  active: number
  under_construction: number
  completed: number
  total_units: number
  available_units: number
  sold_units: number
}

export interface ProjectListParams {
  search?: string
  type?: string
  status?: string
  city?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  limit?: number
  page?: number
}

export interface CreateProjectPayload {
  name: string
  code: string
  type: string
  status: string
  rera_number?: string
  location?: string
  city?: string
  state?: string
  pincode?: string
  landmark?: string
  google_map_url?: string
  developer?: string
  budget?: number
  total_units?: number
  available_units?: number
  sold_units?: number
  price_min?: number
  price_max?: number
  launch_date?: string
  possession_date?: string
  construction_stage?: string
  construction_pct?: number
  description?: string
  amenities?: string[]
  manager_id?: number
  
  // Excel Columns
  sr_no?: string
  project_type?: string
  project_status?: string
  passession?: string
  price?: string
  size_sqft?: string
  contact_person?: string
  contact_number?: string
  brochure_link?: string
  remarks?: string
}

// ---------------------------------------------------------------------------
// HR Employee Types
// ---------------------------------------------------------------------------
export interface ApiHREmployee {
  id: number
  user_id: number | null
  user?: { id: number; name: string; email: string } | null
  employee_code: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  designation: string
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern' | 'probation'
  status: 'active' | 'on_leave' | 'suspended' | 'terminated'
  joining_date: string
  salary: number | null
  pan_number: string | null
  aadhar_number: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  address: string | null
  bank_name: string | null
  account_number: string | null
  ifsc_code: string | null
  notes: string | null
  profile_image?: string | null
  work_latitude?: number | null
  work_longitude?: number | null
  hra?: number | null
  allowances?: number | null
  deductions?: number | null
  created_at: string
  updated_at: string

  // Excel Columns
  sr_no?: string | null
  dob?: string | null
  gender?: string | null
  personal_phone?: string | null
  office_phone?: string | null
  personal_email?: string | null
  office_email?: string | null
  manager?: string | null
  device_assigned?: string | null
  laptop_model?: string | null
  laptop_serial_number?: string | null
  mobile_model?: string | null
  mobile_serial_number?: string | null
  location?: string | null
}

export interface HREmployeeStats {
  all: number
  active: number
  on_leave: number
  full_time: number
  total_payroll: number
  departments: Record<string, number>
}

export interface EmployeeListParams {
  search?: string
  department?: string
  status?: string
  employment_type?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  limit?: number
  page?: number
}

export interface CreateHREmployeePayload {
  user_id?: number
  employee_code: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  designation: string
  employment_type: string
  status: string
  joining_date: string
  salary?: number
  pan_number?: string
  aadhar_number?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  address?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  notes?: string
  work_latitude?: number
  work_longitude?: number
  hra?: number
  allowances?: number
  deductions?: number

  // Excel Columns
  sr_no?: string
  dob?: string
  gender?: string
  personal_phone?: string
  office_phone?: string
  personal_email?: string
  office_email?: string
  manager?: string
  device_assigned?: string
  laptop_model?: string
  laptop_serial_number?: string
  mobile_model?: string
  mobile_serial_number?: string
  location?: string
}

export interface ApiAttendance {
  id: number
  user_id: number | null
  employee_id: number
  employee?: ApiHREmployee
  date: string
  clock_in: string | null
  clock_out: string | null
  work_hours: number
  status: 'present' | 'late' | 'half_day' | 'absent'
  notes: string | null
  latitude?: number | null
  longitude?: number | null
  created_at: string
}

export interface ApiLeave {
  id: number
  user_id: number | null
  employee_id: number
  employee?: ApiHREmployee
  leave_type: 'casual' | 'sick' | 'earned' | 'unpaid'
  start_date: string
  end_date: string
  days_count: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by: number | null
  approver?: { id: number; name: string }
  admin_notes: string | null
  created_at: string
}

export interface ApiPayroll {
  id: number
  employee_id: number
  employee?: ApiHREmployee
  month: number
  year: number
  basic_salary: number
  hra: number
  allowances: number
  deductions: number
  net_salary: number
  status: 'pending' | 'processing' | 'paid'
  payment_date: string | null
  payment_method: string | null
  notes: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Inventory Management Types
// ---------------------------------------------------------------------------
export interface ApiTower {
  id: number
  project_id: number
  tower_name: string
  total_floors: number
  units_per_floor: number
  has_lift: boolean
  parking_details: string | null
  units_count?: number
  available_units_count?: number
  created_at: string
}

export interface ApiUnit {
  id: number
  tower_id: number
  project_id: number
  unit_number: string
  floor_number: number
  bhk_type: string
  carpet_area: number | null
  built_up_area: number | null
  super_built_up_area: number | null
  facing: string | null
  base_price: number | null
  price_per_sqft: number | null
  floor_rise_charges: number
  plc_charges: number
  parking_charges: number
  club_house_charges: number
  gst_amount: number
  total_price: number | null
  status: 'available' | 'reserved' | 'hold' | 'booked' | 'sold' | 'cancelled' | 'blocked'
  tower?: { id: number; tower_name: string }
  created_at: string
}

export interface ApiBooking {
  id: number
  unit_id: number
  lead_id: number | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  assigned_to: number | null
  booking_date: string
  booking_amount: number
  agreement_status: 'draft' | 'signed' | 'registered'
  notes: string | null
  unit?: ApiUnit
  lead?: { id: number; lead_number: string; name: string; phone: string }
  assignedTo?: { id: number; name: string }
  payments?: ApiPayment[]
  created_at: string
}

export interface ApiPayment {
  id: number
  booking_id: number
  payment_type: 'booking' | 'installment' | 'final' | 'registration'
  amount: number
  due_date: string | null
  paid_date: string | null
  payment_status: 'pending' | 'paid' | 'overdue'
  receipt_url: string | null
  notes: string | null
  created_at: string
}

export interface ApiProjectConfig {
  id: number
  project_id: number
  bhk_type: string
  carpet_area_min: number | null
  carpet_area_max: number | null
  price_from: number | null
  price_to: number | null
}

// ---------------------------------------------------------------------------
// Inventory API helpers
// ---------------------------------------------------------------------------
export const inventoryApi = {
  // Towers
  getTowers: (projectId: number) =>
    api.get<ApiSuccessResponse<ApiTower[]>>(`/projects/${projectId}/towers`),
  createTower: (projectId: number, data: Partial<ApiTower>) =>
    api.post<ApiSuccessResponse<ApiTower>>(`/projects/${projectId}/towers`, data),
  updateTower: (towerId: number, data: Partial<ApiTower>) =>
    api.patch<ApiSuccessResponse<ApiTower>>(`/towers/${towerId}`, data),
  deleteTower: (towerId: number) =>
    api.delete(`/towers/${towerId}`),

  // Units
  getUnits: (towerId: number, params?: { status?: string; bhk_type?: string }) =>
    api.get<ApiSuccessResponse<ApiUnit[]>>(`/towers/${towerId}/units`, { params }),
  createUnit: (towerId: number, data: Partial<ApiUnit>) =>
    api.post<ApiSuccessResponse<ApiUnit>>(`/towers/${towerId}/units`, data),
  updateUnit: (unitId: number, data: Partial<ApiUnit>) =>
    api.patch<ApiSuccessResponse<ApiUnit>>(`/units/${unitId}`, data),
  changeUnitStatus: (unitId: number, status: ApiUnit['status']) =>
    api.patch<ApiSuccessResponse<ApiUnit>>(`/units/${unitId}/status`, { status }),
  deleteUnit: (unitId: number) =>
    api.delete(`/units/${unitId}`),

  // Bookings
  getBookings: (params?: { search?: string; agreement_status?: string; limit?: number; page?: number }) =>
    api.get<ApiSuccessResponse<ApiBooking[]>>(`/bookings`, { params }),
  createBooking: (data: Partial<ApiBooking>) =>
    api.post<ApiSuccessResponse<ApiBooking>>(`/bookings`, data),
  getBooking: (id: number) =>
    api.get<ApiSuccessResponse<ApiBooking>>(`/bookings/${id}`),
  updateBooking: (id: number, data: Partial<ApiBooking>) =>
    api.patch<ApiSuccessResponse<ApiBooking>>(`/bookings/${id}`, data),

  // Payments
  getPayments: (bookingId: number) =>
    api.get<{ success: boolean; data: ApiPayment[]; summary: { total_due: number; total_paid: number; pending: number; overdue: number } }>(`/bookings/${bookingId}/payments`),
  createPayment: (bookingId: number, data: Partial<ApiPayment>) =>
    api.post<ApiSuccessResponse<ApiPayment>>(`/bookings/${bookingId}/payments`, data),
  updatePayment: (paymentId: number, data: Partial<ApiPayment>) =>
    api.patch<ApiSuccessResponse<ApiPayment>>(`/payments/${paymentId}`, data),

  // Project Configurations
  getConfigurations: (projectId: number) =>
    api.get<ApiSuccessResponse<ApiProjectConfig[]>>(`/projects/${projectId}/configurations`),
  createConfiguration: (projectId: number, data: Partial<ApiProjectConfig>) =>
    api.post<ApiSuccessResponse<ApiProjectConfig>>(`/projects/${projectId}/configurations`, data),
  updateConfiguration: (projectId: number, configId: number, data: Partial<ApiProjectConfig>) =>
    api.patch<ApiSuccessResponse<ApiProjectConfig>>(`/projects/${projectId}/configurations/${configId}`, data),
  deleteConfiguration: (projectId: number, configId: number) =>
    api.delete(`/projects/${projectId}/configurations/${configId}`),
}

// ---------------------------------------------------------------------------
// Reports & Analytics API
// ---------------------------------------------------------------------------
export const reportsApi = {
  leads: (params?: { start_date?: string; end_date?: string }) =>
    api.get<ApiSuccessResponse<{ daily_ingestion: any[]; source_effectiveness: any[] }>>('/reports/leads', { params }),

  sales: (params?: { start_date?: string; end_date?: string }) =>
    api.get<ApiSuccessResponse<{ revenue_by_project: any[]; avg_cycle_days: number }>>('/reports/sales', { params }),

  employees: () =>
    api.get<ApiSuccessResponse<any[]>>('/reports/employees'),

  projects: () =>
    api.get<ApiSuccessResponse<any[]>>('/reports/projects'),

  inventory: () =>
    api.get<ApiSuccessResponse<{ summary: any; projects: any[] }>>('/reports/inventory'),

  marketing: () =>
    api.get<ApiSuccessResponse<any[]>>('/reports/marketing'),

  sla: () =>
    api.get<ApiSuccessResponse<any[]>>('/reports/sla'),
}
