'use client'

import React from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore, ToastType } from '@/store/useToastStore'
import { cn } from '@/lib/utils'

const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]',
  error: 'bg-[#fef2f2] border-[#fca5a5] text-[#991b1b]',
  info: 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af]',
  warning: 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = TOAST_ICONS[toast.type]
        const style = TOAST_STYLES[toast.type]

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 rounded-cards border shadow-lg transition-all duration-300 animate-slide-in',
              style
            )}
          >
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity rounded-full p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
