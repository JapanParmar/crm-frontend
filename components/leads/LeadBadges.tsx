'use client'

import React from 'react'
import {
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_COLORS,
  LEAD_SOURCE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from '@/lib/constants'
import type { LeadStatus, LeadSource, LeadPriority } from '@/types'
import { StatusBadge } from '@/components/ui/badge'

interface LeadStatusBadgeProps {
  status: LeadStatus
  size?: 'sm' | 'md'
  dot?: boolean
}

export function LeadStatusBadge({ status, size, dot }: LeadStatusBadgeProps) {
  const colors = LEAD_STATUS_COLORS[status]
  return (
    <StatusBadge
      label={LEAD_STATUS_LABELS[status]}
      bg={colors.bg}
      text={colors.text}
      border={colors.border}
      size={size}
      dot={dot}
    />
  )
}

interface LeadSourceBadgeProps {
  source: LeadSource
  size?: 'sm' | 'md'
}

export function LeadSourceBadge({ source, size }: LeadSourceBadgeProps) {
  const colors = LEAD_SOURCE_COLORS[source]
  return (
    <StatusBadge
      label={LEAD_SOURCE_LABELS[source]}
      bg={colors.bg}
      text={colors.text}
      size={size}
    />
  )
}

interface PriorityBadgeProps {
  priority: LeadPriority
  size?: 'sm' | 'md'
}

export function PriorityBadge({ priority, size }: PriorityBadgeProps) {
  const colors = PRIORITY_COLORS[priority]
  return (
    <StatusBadge
      label={PRIORITY_LABELS[priority]}
      bg={colors.bg}
      text={colors.text}
      size={size}
      dot={priority === 'urgent' || priority === 'high'}
    />
  )
}

export { PriorityBadge as LeadPriorityBadge }

// Lead Score component
interface LeadScoreProps {
  score: number
  size?: 'sm' | 'md'
}

export function LeadScore({ score, size = 'sm' }: LeadScoreProps) {
  const getScoreDetails = (val: number) => {
    if (val >= 75) return { color: 'var(--color-grass-green)', bg: 'rgba(0, 202, 72, 0.1)' }
    if (val >= 50) return { color: 'var(--color-gold)', bg: 'rgba(255, 187, 38, 0.15)' }
    if (val >= 25) return { color: 'var(--color-ember)', bg: 'rgba(255, 62, 0, 0.1)' }
    return { color: 'var(--color-alert-red)', bg: 'rgba(220, 38, 38, 0.1)' }
  }
  const { color, bg } = getScoreDetails(score)

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-stone-surface border border-stone-border rounded-full overflow-hidden" style={{ width: size === 'sm' ? '40px' : '60px' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-xs font-semibold px-1 py-0.5 rounded-badges border border-stone-border"
        style={{ backgroundColor: bg, color }}
      >
        {score}
      </span>
    </div>
  )
}
