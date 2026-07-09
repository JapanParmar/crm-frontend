'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LeadFilters } from '@/types'

interface AppState {
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

  // Preferences
  fontSize: 'sm' | 'base' | 'lg' | 'xl'
  fontFamily: 'sans' | 'inter' | 'outfit' | 'jakarta'
  theme: 'classic' | 'dark' | 'warm' | 'mint' | 'indigo' | 'custom'
  customCanvasColor: string
  customSurfaceColor: string
  customAccentColor: string
  skeletonStyle: 'shimmer' | 'pulse'
  setFontSize: (size: 'sm' | 'base' | 'lg' | 'xl') => void
  setFontFamily: (family: 'sans' | 'inter' | 'outfit' | 'jakarta') => void
  setTheme: (theme: 'classic' | 'dark' | 'warm' | 'mint' | 'indigo' | 'custom') => void
  setCustomCanvasColor: (color: string) => void
  setCustomSurfaceColor: (color: string) => void
  setCustomAccentColor: (color: string) => void
  setSkeletonStyle: (style: 'shimmer' | 'pulse') => void

  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
}

const defaultFilters: LeadFilters = {}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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

      // Preferences
      fontSize: 'base',
      fontFamily: 'sans',
      theme: 'classic',
      customCanvasColor: '#f4f4f5',
      customSurfaceColor: '#ffffff',
      customAccentColor: '#ff5a00',
      skeletonStyle: 'shimmer',
      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setTheme: (theme) => set({ theme }),
      setCustomCanvasColor: (customCanvasColor) => set({ customCanvasColor }),
      setCustomSurfaceColor: (customSurfaceColor) => set({ customSurfaceColor }),
      setCustomAccentColor: (customAccentColor) => set({ customAccentColor }),
      setSkeletonStyle: (skeletonStyle) => set({ skeletonStyle }),

      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'crm-app-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        theme: state.theme,
        customCanvasColor: state.customCanvasColor,
        customSurfaceColor: state.customSurfaceColor,
        customAccentColor: state.customAccentColor,
        skeletonStyle: state.skeletonStyle,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
