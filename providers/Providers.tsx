'use client'

import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

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
  const { isAuthenticated, token, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // Wait for Zustand store to hydrate
    if (!_hasHydrated) {
      return
    }

    const isPublic = PUBLIC_PATHS.includes(pathname)

    if (!isAuthenticated && !token && !isPublic) {
      router.replace('/login')
    } else if ((isAuthenticated || token) && isPublic) {
      router.replace('/')
    }
  }, [_hasHydrated, isAuthenticated, token, pathname, router])

  const isPublic = PUBLIC_PATHS.includes(pathname)

  // Always show public pages immediately
  if (isPublic) return <>{children}</>

  // Show nothing until auth check complete (prevents flash)
  if (!_hasHydrated) return null

  // Double check auth status before rendering protected content
  if (!isAuthenticated && !token) return null

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>{children}</AuthGuard>
    </QueryClientProvider>
  )
}
