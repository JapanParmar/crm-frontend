import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, AccessFlags } from '@/lib/api'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  // Actions
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
  updateUser: (user: AuthUser) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('crm_token', token)
        }
        set({ token, user, isAuthenticated: true })
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('crm_token')
          localStorage.removeItem('crm_user')
        }
        set({ token: null, user: null, isAuthenticated: false })
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'crm-auth-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// Convenience selectors
export const useIsAdmin = () => {
  const user = useAuthStore((s) => s.user)
  return user?.roles?.includes('admin') ?? false
}

export const useAccess = () => {
  const user = useAuthStore((s) => s.user)
  const defaults: AccessFlags = {
    dashboard: false,
    leads: false,
    all_leads: false,
    my_leads: false,
    import_leads: false,
    assign_leads: false,
    follow_ups: false,
    site_visits: false,
    users: false,
    activity_log: false,
    settings: false,
    rbac: false,
  }
  return user?.access ?? defaults
}

export const useCurrentUser = () => useAuthStore((s) => s.user)
