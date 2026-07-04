'use client'

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  accent?: string
  description?: string
  onClick?: () => void
}

export function StatCard({ label, value, change, changeLabel, icon, accent, description, onClick }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0
  const isNegative = change !== undefined && change < 0

  return (
    <div
      className={cn(
        'bg-white rounded-cards p-4 flex flex-col gap-3 transition-all duration-150',
        onClick && 'cursor-pointer hover:bg-stone-surface/30'
      )}
      style={{
        boxShadow: 'inset 0 0 0 1px var(--color-stone-surface)',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-body-brown leading-tight">{label}</span>
        {icon && (
          <div
            className="w-7 h-7 rounded-full bg-stone-surface flex items-center justify-center flex-shrink-0 text-heading-charcoal"
          >
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-bold text-heading-charcoal leading-none mb-1.5">{value}</div>
        {(change !== undefined || description) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {change !== undefined && (
              <div className={cn('flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-pills', isPositive ? 'bg-mint/15 text-grass-green' : 'bg-alert-red/10 text-alert-red')}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{change}%
              </div>
            )}
            {changeLabel && (
              <span className="text-xs text-muted-gray">{changeLabel}</span>
            )}
            {description && !change && (
              <span className="text-xs text-muted-gray">{description}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string | number
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: string
}

export function MetricCard({ label, value, subValue, trend, trendValue, color = 'var(--color-heading-charcoal)' }: MetricCardProps) {
  return (
    <div
      className="flex items-center justify-between py-2.5 px-3 rounded-cards bg-white"
      style={{
        boxShadow: 'inset 0 0 0 1px var(--color-stone-surface)',
      }}
    >
      <div>
        <p className="text-xs font-semibold text-body-brown mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-heading-charcoal">{value}</p>
        {subValue && <p className="text-xs text-muted-gray">{subValue}</p>}
      </div>
      {(trend || trendValue) && (
        <div
          className={cn(
            'text-xs font-medium flex items-center gap-0.5',
            trend === 'up' ? 'text-grass-green' : trend === 'down' ? 'text-alert-red' : 'text-muted-gray'
          )}
        >
          {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
          {trendValue}
        </div>
      )}
    </div>
  )
}
