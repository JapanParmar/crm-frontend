'use client'

import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { ToastContainer } from '@/components/ui/toast'

// Single QueryClient instance for the app lifetime
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30 s — avoid refetching on tab focus for quick interactions
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Pages that don't need authentication
const PUBLIC_PATHS = ['/login']

function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, token, _hasHydrated, user } = useAuthStore()

  useEffect(() => {
    // Wait for Zustand store to hydrate
    if (!_hasHydrated) {
      return
    }

    const isPublic = PUBLIC_PATHS.includes(pathname)

    if (!isAuthenticated && !token && !isPublic) {
      router.replace('/login')
      return
    } else if ((isAuthenticated || token) && isPublic) {
      router.replace('/')
      return
    }

    // Client-side route-level permission checks
    if ((isAuthenticated || token) && !isPublic && user) {
      const access = user.access
      if (access) {
        let hasAccess = true
        if (pathname === '/rbac') hasAccess = !!access.rbac
        else if (pathname === '/team') hasAccess = !!access.users
        else if (pathname === '/import') hasAccess = !!access.import_leads
        else if (pathname === '/activity') hasAccess = !!access.activity_log
        else if (pathname === '/settings') hasAccess = !!access.settings
        else if (pathname === '/reports') hasAccess = !!access.users
        else if (pathname.startsWith('/leads') || pathname === '/pipeline') hasAccess = !!access.leads
        else if (pathname === '/follow-ups') hasAccess = !!access.follow_ups
        else if (pathname === '/site-visits') hasAccess = !!access.site_visits
        else if (pathname === '/') hasAccess = !!access.dashboard

        if (!hasAccess) {
          const fallback = access.dashboard ? '/' : '/calendar'
          router.replace(fallback)
          const { useToastStore } = require('@/store/useToastStore')
          useToastStore.getState().addToast('Access Denied: You do not have permission to view that page.', 'error')
        }
      }
    }
  }, [_hasHydrated, isAuthenticated, token, pathname, router, user])

  const isPublic = PUBLIC_PATHS.includes(pathname)

  // Show nothing until auth check complete (prevents flash)
  if (!_hasHydrated) return null

  // Always show public pages immediately if hydration is complete
  if (isPublic) return <>{children}</>

  // Double check auth status before rendering protected content
  if (!isAuthenticated && !token) return null

  return <>{children}</>
}

import { useAppStore } from '@/store/useAppStore'

function PreferencesWrapper({ children }: { children: React.ReactNode }) {
  const fontSize = useAppStore((s) => s.fontSize)
  const fontFamily = useAppStore((s) => s.fontFamily)
  const theme = useAppStore((s) => s.theme)
  const customCanvasColor = useAppStore((s) => s.customCanvasColor)
  const customSurfaceColor = useAppStore((s) => s.customSurfaceColor)
  const customAccentColor = useAppStore((s) => s.customAccentColor)
  const hasHydrated = useAppStore((s) => s._hasHydrated)
  const user = useAuthStore((s) => s.user)

  // Sync DB preferences to Zustand local store on login/refresh
  useEffect(() => {
    if (user?.preferences) {
      const prefs = user.preferences
      if (prefs.fontSize) useAppStore.getState().setFontSize(prefs.fontSize)
      if (prefs.fontFamily) useAppStore.getState().setFontFamily(prefs.fontFamily)
      if (prefs.theme) useAppStore.getState().setTheme(prefs.theme)
      if (prefs.customCanvasColor) useAppStore.getState().setCustomCanvasColor(prefs.customCanvasColor)
      if (prefs.customSurfaceColor) useAppStore.getState().setCustomSurfaceColor(prefs.customSurfaceColor)
      if (prefs.customAccentColor) useAppStore.getState().setCustomAccentColor(prefs.customAccentColor)
      if (prefs.skeletonStyle) useAppStore.getState().setSkeletonStyle(prefs.skeletonStyle)
    }
  }, [user?.id])

  useEffect(() => {
    if (!hasHydrated) return

    const root = document.documentElement

    // 1. Font Size
    const sizeMap = {
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
    }
    root.style.setProperty('--base-font-size', sizeMap[fontSize] || '16px')

    // 2. Font Family
    const families = ['font-family-dm-sans', 'font-family-inter', 'font-family-outfit', 'font-family-plus-jakarta']
    families.forEach((f) => root.classList.remove(f))
    
    if (fontFamily === 'sans') {
      root.classList.add('font-family-dm-sans')
    } else {
      root.classList.add(`font-family-${fontFamily}`)
    }

    // 3. Theme
    const themes = ['theme-classic', 'theme-dark', 'theme-warm', 'theme-mint', 'theme-indigo', 'theme-custom']
    themes.forEach((t) => root.classList.remove(t))
    root.classList.add(`theme-${theme}`)

    // 4. Custom Accent & Colors
    if (theme === 'custom') {
      root.style.setProperty('--color-cream-canvas', customCanvasColor)
      root.style.setProperty('--color-stone-surface', customSurfaceColor)
      root.style.setProperty('--color-ember', customAccentColor)
      root.style.setProperty('--color-ember-orange', customAccentColor)
      root.style.setProperty('--color-brand', customAccentColor)
    } else {
      root.style.removeProperty('--color-cream-canvas')
      root.style.removeProperty('--color-stone-surface')
      root.style.removeProperty('--color-ember')
      root.style.removeProperty('--color-ember-orange')
      root.style.removeProperty('--color-brand')
    }
  }, [fontSize, fontFamily, theme, customCanvasColor, customSurfaceColor, customAccentColor, hasHydrated])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesWrapper>
        <AuthGuard>{children}</AuthGuard>
      </PreferencesWrapper>
      <ToastContainer />
    </QueryClientProvider>
  )
}
