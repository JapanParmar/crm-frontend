'use client'

import React, { useState } from 'react'
import { Search, Bell, Plus, Command, ChevronDown, Menu, ChevronLeft } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { useCurrentUser, useAuthStore } from '@/store/useAuthStore'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { activityApi } from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, User } from 'lucide-react'

interface AppHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  backHref?: string
}

export function AppHeader({ title, subtitle, actions, breadcrumbs, backHref }: AppHeaderProps) {
  const { setCommandPaletteOpen, setAddLeadOpen, sidebarCollapsed, toggleSidebar } = useAppStore()
  const currentUser = useCurrentUser()
  const { clearAuth } = useAuthStore()
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const { data: notificationsData } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: () => activityApi.list({ limit: 5 }).then((r) => r.data.data),
    enabled: !!currentUser,
    refetchInterval: 60000,
  })

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-20 flex items-center justify-between px-4 border-b transition-all duration-200 ease-in-out",
        sidebarCollapsed ? "left-0 md:left-14" : "left-0 md:left-[220px]"
      )}
      style={{
        height: '56px',
        backgroundColor: 'var(--color-cream-canvas)',
        borderColor: 'var(--color-stone-surface)',
      }}
    >
      {/* Left: Menu toggle + Back Button + Page Title Area */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Toggle sidebar button for mobile */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black transition-colors flex-shrink-0"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Back Button */}
        {backHref && (
          <Link
            href={backHref}
            className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black transition-colors flex items-center justify-center border border-stone-border/45 bg-white flex-shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        )}

        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-body-brown truncate">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-muted-gray mx-0.5">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-ink-black transition-colors font-medium truncate">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-heading-charcoal font-bold truncate">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        {!breadcrumbs && (
          <div className="truncate">
            <h1 className="text-sm font-bold text-heading-charcoal leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-[10px] text-body-brown leading-tight truncate">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 h-9 px-3.5 rounded-buttons border border-stone-border bg-white text-body-brown text-xs hover:border-ink-black hover:bg-stone-surface transition-all duration-100"
          aria-label="Open search"
        >
          <Search className="w-3 h-3 text-body-brown" />
          <span className="hidden lg:block text-body-brown font-medium">Search...</span>
          <kbd className="hidden lg:flex items-center gap-0.5 font-mono text-xs text-muted-gray">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Add Lead */}
        {currentUser?.permissions?.includes('create-leads') && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setAddLeadOpen(true)}
          >
            Add Lead
          </Button>
        )}

        {/* Custom Actions */}
        {actions}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn(
              "relative w-7 h-7 rounded-full flex items-center justify-center text-body-brown hover:bg-stone-surface hover:text-ink-black transition-colors",
              notificationsOpen && "bg-stone-surface text-ink-black"
            )}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-alert-red animate-pulse" />
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-cards border border-stone-surface shadow-premium z-40 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-stone-surface pb-2">
                  <span className="text-xs font-bold text-heading-charcoal">Recent Notifications</span>
                  <span className="text-[10px] bg-stone-surface text-body-brown px-1.5 py-0.5 rounded font-bold">Live</span>
                </div>
                
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {!notificationsData || notificationsData.length === 0 ? (
                    <div className="text-center py-6 text-[11px] text-muted-gray">
                      No new notifications
                    </div>
                  ) : (
                    notificationsData.map((act) => (
                      <div key={act.id} className="text-left text-xs p-2 rounded hover:bg-[#fcfbf9] transition-colors border border-transparent hover:border-stone-surface">
                        <p className="font-semibold text-heading-charcoal leading-snug">{act.description}</p>
                        <div className="flex items-center justify-between mt-1 text-[9px] text-muted-gray">
                          <span>By {act.performed_by?.name || 'System'}</span>
                          <span>{formatDate(act.created_at, 'relative')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-stone-surface pt-2 text-center">
                  <Link
                    href="/activity"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[10px] font-bold text-ink-black hover:underline uppercase tracking-wider block"
                  >
                    View All Activity Log
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={cn(
                "flex items-center gap-1.5 rounded-buttons px-2 py-1 hover:bg-stone-surface border border-stone-border bg-white transition-colors",
                profileOpen && "bg-stone-surface"
              )}
              aria-label="User profile menu"
            >
              <Avatar name={currentUser.name} size="xs" />
              <span className="hidden sm:block text-xs font-semibold text-heading-charcoal">{currentUser.name.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-muted-gray" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-cards border border-stone-surface shadow-premium z-40 py-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 pb-2 border-b border-stone-surface">
                    <p className="text-xs font-extrabold text-heading-charcoal truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-muted-gray truncate mt-0.5">{currentUser.email}</p>
                    {currentUser.roles && currentUser.roles.length > 0 && (
                      <span className="inline-block text-[8px] font-bold uppercase tracking-wider bg-sun-yellow/15 border border-stone-border/40 text-gold px-1.5 py-0.25 rounded-badges mt-1.5">
                        {currentUser.roles.join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-stone-surface text-xs text-heading-charcoal font-medium transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-muted-gray" /> Settings & Profile
                    </Link>
                  </div>

                  <div className="border-t border-stone-surface pt-1 mt-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        clearAuth()
                        router.push('/login')
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-alert-red/5 text-xs text-alert-red font-semibold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

// Page-level header below the app header
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  tabs?: { label: string; value: string; count?: number }[]
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function PageHeader({ title, description, actions, tabs, activeTab, onTabChange }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-0 select-none">
      {/* Title row */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-surface bg-white relative overflow-hidden">
        <div className="relative z-10 min-w-0">
          <h2 className="font-family-display text-lg md:text-xl text-heading-charcoal tracking-tight truncate">{title}</h2>
          {description && <p className="text-xs text-body-brown mt-0.5 font-medium truncate">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 relative z-10 flex-shrink-0">{actions}</div>}
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-1.5 border-b border-stone-surface bg-[#fcfbf9] overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => onTabChange?.(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-pills transition-all duration-100 border whitespace-nowrap',
                  isActive
                    ? 'bg-ink-black text-white border-ink-black'
                    : 'bg-transparent text-body-brown border-transparent hover:text-ink-black hover:bg-stone-surface'
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'px-1.5 py-0.25 rounded-full text-[10px] font-bold border ml-0.5',
                      isActive ? 'bg-[#ffcd6c] text-[#121212] border-[#ffcd6c]' : 'bg-stone-surface text-body-brown border-stone-border'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
