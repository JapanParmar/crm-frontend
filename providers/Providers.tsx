'use client'

import React, { useEffect, useState } from 'react'
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
  const { isAuthenticated, token } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.includes(pathname)
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : null

    // Wait for Zustand store to hydrate if there is a token in localStorage
    if (!isAuthenticated && storedToken) {
      return
    }

    if (!isAuthenticated && !token && !isPublic) {
      router.replace('/login')
    } else if ((isAuthenticated || token) && isPublic) {
      router.replace('/')
    } else {
      setChecked(true)
    }
  }, [isAuthenticated, token, pathname, router])

  const isPublic = PUBLIC_PATHS.includes(pathname)

  // Always show public pages immediately
  if (isPublic) return <>{children}</>

  // Show nothing until auth check complete (prevents flash)
  if (!checked) return null

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>{children}</AuthGuard>
    </QueryClientProvider>
  )
}
