'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LeadFilters } from '@/types'

interface AppState {
  // Auth
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Sidebar
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // Lead Filters
  leadFilters: LeadFilters
  setLeadFilters: (filters: LeadFilters) => void
  resetLeadFilters: () => void

  // Selected Leads (for bulk actions)
  selectedLeadIds: Set<string>
  setSelectedLeadIds: (ids: Set<string>) => void
  toggleLeadSelection: (id: string) => void
  clearLeadSelection: () => void

  // Command Palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Modals
  addLeadOpen: boolean
  setAddLeadOpen: (open: boolean) => void
}

const defaultFilters: LeadFilters = {}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      currentUser: {
        id: 'user-1',
        name: 'Arjun Rathore',
        email: 'arjun.rathore@propcrm.in',
        phone: '9876543210',
        role: 'admin',
        isActive: true,
        assignedLeads: 0,
        closedDeals: 0,
        createdAt: new Date().toISOString(),
      },
      setCurrentUser: (user) => set({ currentUser: user }),

      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // Lead Filters
      leadFilters: defaultFilters,
      setLeadFilters: (filters) => set({ leadFilters: filters }),
      resetLeadFilters: () => set({ leadFilters: defaultFilters }),

      // Selected Leads
      selectedLeadIds: new Set(),
      setSelectedLeadIds: (ids) => set({ selectedLeadIds: ids }),
      toggleLeadSelection: (id) =>
        set((s) => {
          const next = new Set(s.selectedLeadIds)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return { selectedLeadIds: next }
        }),
      clearLeadSelection: () => set({ selectedLeadIds: new Set() }),

      // Command Palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // Modals
      addLeadOpen: false,
      setAddLeadOpen: (open) => set({ addLeadOpen: open }),
    }),
    {
      name: 'crm-app-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
