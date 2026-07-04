'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-heading-charcoal">
            {label}
            {props.required && <span className="text-alert-red ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-gray pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-9 rounded-inputs border border-stone-border bg-white text-[14px] text-heading-charcoal placeholder:text-muted-gray',
              'focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black',
              'transition-shadow duration-100',
              icon ? 'pl-8' : 'pl-4',
              iconRight ? 'pr-8' : 'pr-4',
              error && 'border-alert-red focus:ring-alert-red',
              props.disabled && 'bg-stone-surface text-muted-gray cursor-not-allowed',
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-gray">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-alert-red">{error}</p>}
        {hint && !error && <p className="text-xs text-muted-gray">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-heading-charcoal">
            {label}
            {props.required && <span className="text-alert-red ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-9 rounded-inputs border border-stone-border bg-white text-[14px] text-heading-charcoal',
            'focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black',
            'transition-shadow duration-100 px-4',
            error && 'border-alert-red focus:ring-alert-red',
            props.disabled && 'bg-stone-surface text-muted-gray cursor-not-allowed',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-alert-red">{error}</p>}
        {hint && !error && <p className="text-xs text-muted-gray">{hint}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-heading-charcoal">
            {label}
            {props.required && <span className="text-alert-red ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-inputs border border-stone-border bg-white text-[14px] text-heading-charcoal placeholder:text-muted-gray',
            'focus:outline-none focus:border-ink-black focus:ring-1 focus:ring-ink-black',
            'transition-shadow duration-100 px-4 py-3 resize-none',
            error && 'border-alert-red focus:ring-alert-red',
            props.disabled && 'bg-stone-surface text-muted-gray cursor-not-allowed',
            className
          )}
          rows={3}
          {...props}
        />
        {error && <p className="text-xs text-alert-red">{error}</p>}
        {hint && !error && <p className="text-xs text-muted-gray">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
