'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const handleSubmit = async (data: LoginForm) => {
    setLoading(true)
    setApiError(null)
    try {
      const res = await authApi.login(data.email, data.password)
      const { token, user } = res.data.data
      setAuth(token, user)
      router.replace('/')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setApiError(error?.response?.data?.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-cream-canvas)' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-[420px] flex-col justify-between p-10 flex-shrink-0 select-none"
        style={{ backgroundColor: 'var(--color-ink-black)' }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-sun-yellow)' }}
            >
              <Building2 className="w-4 h-4 text-[#121212]" />
            </div>
            <div>
              <p className="text-white text-sm font-extrabold tracking-tight">BRICKroots</p>
              <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Enterprise CRM</p>
            </div>
          </div>

          <h1
            className="text-4xl font-extrabold tracking-tight leading-tight mb-4"
            style={{ color: 'var(--color-snow)' }}
          >
            Infrastructure-grade<br />lead telemetry.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Track leads, orchestrate site visits, and optimize your real estate sales pipeline.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { stat: '847', label: 'Active Leads' },
            { stat: '16.7%', label: 'Conversion Rate' },
            { stat: '4', label: 'Active Employees' },
          ].map(({ stat, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className="text-xl font-bold"
                style={{ color: 'var(--color-sun-yellow)' }}
              >
                {stat}
              </span>
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-ink-black)' }}
            >
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-extrabold tracking-tight text-ink-black">BRICKroots CRM</p>
          </div>

          <h2 className="text-2xl font-bold text-heading-charcoal mb-1 tracking-tight">Sign in</h2>
          <p className="text-xs text-body-brown mb-8">Enter your credentials to access the CRM workspace.</p>

          {/* API Error */}
          {apiError && (
            <div
              className="flex items-center gap-2.5 p-3 rounded-cards mb-5 border"
              style={{
                backgroundColor: 'rgba(224, 36, 36, 0.06)',
                borderColor: 'rgba(224, 36, 36, 0.2)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-alert-red)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--color-alert-red)' }}>
                {apiError}
              </p>
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-heading-charcoal mb-1.5">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                {...form.register('email')}
                className="w-full h-10 px-3 rounded-buttons border text-sm outline-none transition-all duration-100"
                style={{
                  backgroundColor: 'var(--color-snow)',
                  borderColor: form.formState.errors.email
                    ? 'var(--color-alert-red)'
                    : 'var(--color-stone-border)',
                  color: 'var(--color-ink-black)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-ink-black)' }}
                onBlur={(e) => {
                  e.target.style.borderColor = form.formState.errors.email
                    ? 'var(--color-alert-red)'
                    : 'var(--color-stone-border)'
                }}
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-[11px]" style={{ color: 'var(--color-alert-red)' }}>
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-heading-charcoal mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...form.register('password')}
                  className="w-full h-10 px-3 pr-10 rounded-buttons border text-sm outline-none transition-all duration-100"
                  style={{
                    backgroundColor: 'var(--color-snow)',
                    borderColor: form.formState.errors.password
                      ? 'var(--color-alert-red)'
                      : 'var(--color-stone-border)',
                    color: 'var(--color-ink-black)',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-ink-black)' }}
                  onBlur={(e) => {
                    e.target.style.borderColor = form.formState.errors.password
                      ? 'var(--color-alert-red)'
                      : 'var(--color-stone-border)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-gray hover:text-ink-black transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-[11px]" style={{ color: 'var(--color-alert-red)' }}>
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-buttons text-sm font-semibold transition-all duration-100 active:scale-[0.98] disabled:opacity-60"
              style={{
                backgroundColor: 'var(--color-ink-black)',
                color: 'var(--color-snow)',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-[10px]" style={{ color: 'var(--color-muted-gray)' }}>
            Default: admin@example.com / password
          </p>
        </div>
      </div>
    </div>
  )
}
