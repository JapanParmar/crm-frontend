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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>{children}</AuthGuard>
      <ToastContainer />
    </QueryClientProvider>
  )
}
