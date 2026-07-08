'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Phone,
  CalendarCheck,
  Building2,
  BarChart3,
  Settings,
  UserCog,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Import,
  ScrollText,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore, useAccess, useCurrentUser } from '@/store/useAuthStore'
import { Avatar } from '@/components/ui/avatar'
import { authApi } from '@/lib/api'

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { clearAuth } = useAuthStore()
  const access = useAccess()
  const currentUser = useCurrentUser()

  // Build navigation dynamically from access flags returned by /me
  const NAV_ITEMS = [
    {
      section: 'WORKSPACE',
      items: [
        access.dashboard && { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
        access.leads && { label: 'Leads', icon: Users, href: '/leads' },
        access.follow_ups && { label: 'Follow-ups', icon: Phone, href: '/follow-ups' },
        access.site_visits && { label: 'Site Visits', icon: Building2, href: '/site-visits' },
      ].filter(Boolean),
    },
    {
      section: 'MANAGEMENT',
      items: [
        access.users && { label: 'Team', icon: UserCog, href: '/team' },
        access.import_leads && { label: 'Import', icon: Import, href: '/import' },
        access.activity_log && { label: 'Activity', icon: ScrollText, href: '/activity' },
        { label: 'Calendar', icon: CalendarCheck, href: '/calendar' },
        access.users && { label: 'Reports', icon: BarChart3, href: '/reports' },
      ].filter(Boolean),
    },
    {
      section: 'SYSTEM',
      items: [
        access.settings && { label: 'Settings', icon: Settings, href: '/settings' },
        access.rbac && { label: 'Access Control', icon: Shield, href: '/rbac' },
      ].filter(Boolean),
    },
  ].filter((group) => group.items.length > 0)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // even if logout API fails, clear local state
    } finally {
      clearAuth()
      router.replace('/login')
    }
  }

  // Auto-close sidebar on mobile after nav click
  const handleNavClick = () => {
    if (!sidebarCollapsed && window.innerWidth < 768) {
      toggleSidebar()
    }
  }

  const roleLabel = currentUser?.roles?.includes('superadmin')
    ? 'Super Administrator'
    : currentUser?.roles?.includes('admin')
    ? 'Administrator'
    : 'Sales Executive'

  return (
    <>
      {/* Backdrop overlay for mobile — shown when sidebar is open */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-30 flex flex-col transition-all duration-200 ease-in-out select-none',
          // Mobile: slide out when collapsed, slide in when open
          // Desktop: collapse to icon-only, expand to full
          sidebarCollapsed
            ? '-translate-x-full md:translate-x-0 w-[220px] md:w-14'
            : 'translate-x-0 w-[220px]'
        )}
        style={{ backgroundColor: 'var(--color-stone-surface)', borderRight: '1px solid var(--color-stone-border)' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-3 border-b flex-shrink-0"
          style={{ height: '56px', borderColor: 'var(--color-stone-border)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-sun-yellow)', border: '1px solid var(--color-ink-black)' }}
          >
            <Building2 className="w-4 h-4 text-ink-black" />
          </div>
          <div className={cn('flex flex-col min-w-0', sidebarCollapsed && 'md:hidden')}>
            <span className="text-ink-black text-sm font-extrabold tracking-tight leading-tight truncate">BRICKroots</span>
            <span className="text-[10px] leading-tight font-medium" style={{ color: 'var(--color-body-brown)' }}>Enterprise</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV_ITEMS.map((group) => (
            <div key={group.section}>
              <p
                className={cn(
                  'px-2 mb-1 text-xs font-semibold tracking-wider uppercase',
                  sidebarCollapsed ? 'hidden md:hidden' : 'block'
                )}
                style={{ color: 'var(--color-muted-gray)' }}
              >
                {group.section}
              </p>
              <ul className="space-y-0.5">
                {(group.items as { label: string; icon: React.ElementType; href: string }[]).map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={handleNavClick}
                        className={cn(
                          'flex items-center gap-2.5 rounded-buttons px-3 py-2.5 md:py-1.5 text-xs transition-colors duration-100',
                          isActive
                            ? 'font-semibold border border-stone-border'
                            : 'hover:text-ink-black hover:bg-cream-canvas/50 font-medium',
                          sidebarCollapsed && 'md:justify-center md:px-2'
                        )}
                        style={{
                          color: isActive ? 'var(--color-ink-black)' : 'var(--color-body-brown)',
                          backgroundColor: isActive ? 'var(--color-cream-canvas)' : undefined,
                        }}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon
                          className="flex-shrink-0"
                          style={{
                            width: '15px',
                            height: '15px',
                            stroke: isActive ? 'var(--color-ink-black)' : 'var(--color-body-brown)',
                          }}
                        />
                        <span className={cn('truncate', sidebarCollapsed && 'md:hidden')}>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Profile + Logout */}
        {currentUser && (
          <div
            className="border-t p-2 flex-shrink-0"
            style={{ borderColor: 'var(--color-stone-border)' }}
          >
            <div className="flex items-center gap-2.5">
              <Avatar name={currentUser.name} size="sm" className="flex-shrink-0" />
              <div className={cn('flex-1 min-w-0', sidebarCollapsed && 'md:hidden')}>
                <p className="text-xs font-bold text-ink-black truncate">{currentUser.name}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--color-muted-gray)' }}>
                  {roleLabel}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className={cn(
                  'p-2 rounded hover:bg-stone-surface text-muted-gray hover:text-alert-red transition-colors flex-shrink-0',
                  sidebarCollapsed && 'md:mx-auto'
                )}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Collapse Toggle — desktop only */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-14 w-6 h-6 rounded-full hidden md:flex items-center justify-center border transition-colors duration-100 z-10"
          style={{
            backgroundColor: 'var(--color-cream-canvas)',
            borderColor: 'var(--color-stone-border)',
            color: 'var(--color-heading-charcoal)',
          }}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>
    </>
  )
}
