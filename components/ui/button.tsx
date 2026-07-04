'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-buttons transition-all duration-100 select-none focus-visible:outline-2 focus-visible:outline-offset-2 font-semibold tracking-[-0.009em]'

  const variants = {
    primary: 'bg-ink-black text-cream-canvas hover:opacity-90 active:scale-95 focus-visible:outline-ink-black disabled:opacity-50',
    secondary: 'bg-cloud text-ink-black hover:opacity-90 active:scale-95 focus-visible:outline-stone-border',
    ghost: 'text-heading-charcoal hover:bg-stone-surface active:opacity-80 focus-visible:outline-heading-charcoal',
    danger: 'bg-alert-red text-white hover:opacity-90 active:scale-95 focus-visible:outline-alert-red disabled:opacity-50',
    outline: 'border border-stone-border text-heading-charcoal bg-white hover:bg-stone-surface active:opacity-80 focus-visible:outline-heading-charcoal',
  }

  const sizes = {
    xs: 'h-7 px-3.5 text-xs',
    sm: 'h-8 px-4 text-xs',
    md: 'h-9 px-4.5 text-sm',
    lg: 'h-10 px-5 text-sm',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], (disabled || loading) && 'cursor-not-allowed opacity-60', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
      {iconRight}
    </button>
  )
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  size?: 'xs' | 'sm' | 'md'
  variant?: 'ghost' | 'outline'
  tooltip?: string
  className?: string
}

export function IconButton({ icon, size = 'sm', variant = 'ghost', tooltip, className, ...props }: IconButtonProps) {
  const sizes = { xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-9 h-9' }
  const variants = {
    ghost: 'text-body-brown hover:text-ink-black hover:bg-stone-surface active:bg-stone-surface/80',
    outline: 'border border-stone-border text-heading-charcoal bg-white hover:bg-stone-surface',
  }

  return (
    <button
      title={tooltip}
      className={cn(
        'inline-flex items-center justify-center rounded-buttons transition-all duration-100 focus-visible:outline-2 focus-visible:outline-ink-black',
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  )
}
