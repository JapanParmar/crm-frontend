'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  label: string
  bg: string
  text: string
  border?: string
  size?: 'sm' | 'md'
  dot?: boolean
}

export function StatusBadge({ label, bg, text, border, size = 'sm', dot = false }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-pills whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
      )}
      style={{
        backgroundColor: bg,
        color: text,
        border: border ? `1px solid ${border}` : '1px solid var(--color-stone-surface)',
      }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: text }}
        />
      )}
      {label}
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-badges',
        variant === 'default' && 'bg-stone-surface text-body-brown border border-stone-border',
        variant === 'outline' && 'border border-stone-border text-heading-charcoal bg-white',
        variant === 'secondary' && 'bg-sun-yellow/20 text-gold border border-stone-border',
        className
      )}
    >
      {children}
    </span>
  )
}
