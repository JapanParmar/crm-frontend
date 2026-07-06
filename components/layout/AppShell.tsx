'use client'

import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AppSidebar } from './AppSidebar'
import { CommandPalette } from './CommandPalette'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex h-full min-h-screen bg-cream-canvas">
      <AppSidebar />
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out',
          sidebarCollapsed ? 'ml-0 md:ml-14' : 'ml-0 md:ml-[220px]'
        )}
      >
        {mounted ? (
          <>
            {children}
            <CommandPalette />
          </>
        ) : null}
      </div>
    </div>
  )
}

