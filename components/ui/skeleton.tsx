'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className }: SkeletonProps) {
  const skeletonStyle = useAppStore((s) => s.skeletonStyle)
  const hasHydrated = useAppStore((s) => s._hasHydrated)

  // Use shimmer as default/fallback if not hydrated yet
  const isShimmer = !hasHydrated || skeletonStyle === 'shimmer'

  return (
    <div
      className={cn(
        isShimmer
          ? 'skeleton-shimmer rounded'
          : 'bg-cloud/90 dark:bg-stone-800 rounded animate-pulse',
        className
      )}
    />
  )
}

export function TableSkeleton({ rows = 10, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-stone-border">
          <Skeleton className="w-4 h-4 rounded" />
          {Array.from({ length: cols - 1 }, (_, j) => (
            <Skeleton
              key={j}
              className={cn('h-3.5 rounded', j === 0 ? 'w-24 flex-shrink-0' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-stone-border rounded-cards p-4 flex flex-col gap-2">
      <Skeleton className="w-20 h-3" />
      <Skeleton className="w-16 h-6" />
      <Skeleton className="w-24 h-2.5" />
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="mb-3 text-gray-300">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 mb-4 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  )
}

export function LoadingSpinner({ size = 'sm', className }: { size?: 'xs' | 'sm' | 'md'; className?: string }) {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-6 h-6' }
  return (
    <svg
      className={cn('animate-spin text-ember', sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-cream-canvas/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-stone-border animate-pulse" />
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-t-ember border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="text-xs font-semibold text-heading-charcoal tracking-wider uppercase animate-pulse">
        Loading workspace...
      </p>
    </div>
  )
}

export function CardLoader({ message = 'Loading details...' }: { message?: string }) {
  return (
    <div className="w-full min-h-[200px] flex flex-col items-center justify-center gap-3 p-6 text-center animate-in fade-in duration-200">
      <div className="relative">
        <div className="w-8 h-8 rounded-full border-2 border-stone-border animate-pulse" />
        <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-t-ember border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      {message && <p className="text-xs text-muted-gray">{message}</p>}
    </div>
  )
}
