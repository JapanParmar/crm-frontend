'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#dcfce7', text: '#15803d' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#ede9fe', text: '#5b21b6' },
  { bg: '#ffedd5', text: '#9a3412' },
  { bg: '#ecfeff', text: '#0e7490' },
]

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export function Avatar({ name, src, size = 'sm', className }: AvatarProps) {
  const sizes = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  const color = getAvatarColor(name)
  const initials = getInitials(name)

  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-semibold flex-shrink-0', sizes[size], className)}
      style={{ backgroundColor: color.bg, color: color.text }}
      title={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}

interface AvatarGroupProps {
  names: string[]
  max?: number
  size?: 'xs' | 'sm' | 'md'
}

export function AvatarGroup({ names, max = 3, size = 'sm' }: AvatarGroupProps) {
  const visible = names.slice(0, max)
  const remaining = names.length - max

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((name, i) => (
        <div key={i} className="ring-2 ring-white rounded-full">
          <Avatar name={name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'ring-2 ring-white rounded-full flex items-center justify-center bg-gray-100 text-gray-600 font-medium text-xs',
            size === 'xs' ? 'w-5 h-5' : size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
