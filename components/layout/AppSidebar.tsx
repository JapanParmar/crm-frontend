'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Zap,
  Import,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/avatar'
import { FlowerMascot } from '@/components/ui/Mascots'

const NAV_ITEMS = [
  {
    section: 'WORKSPACE',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
      { label: 'Leads', icon: Users, href: '/leads' },
      { label: 'Follow-ups', icon: Phone, href: '/follow-ups' },
      { label: 'Site Visits', icon: Building2, href: '/site-visits' },
      { label: 'Pipeline', icon: Zap, href: '/pipeline' },
    ],
  },
  {
    section: 'MANAGEMENT',
    items: [
      { label: 'Reports', icon: BarChart3, href: '/reports' },
      { label: 'Import', icon: Import, href: '/import' },
      { label: 'Calendar', icon: CalendarCheck, href: '/calendar' },
      { label: 'Team', icon: UserCog, href: '/team' },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { label: 'Settings', icon: Settings, href: '/settings' },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, currentUser } = useAppStore()

  return (
    <>
      {/* Backdrop overlay for mobile devices */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-[#000000]/15 z-20 md:hidden transition-opacity duration-200"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-30 flex flex-col transition-all duration-200 ease-in-out select-none',
          sidebarCollapsed ? 'w-14 md:w-14 -translate-x-full md:translate-x-0' : 'w-[220px] translate-x-0'
        )}
        style={{ backgroundColor: 'var(--color-stone-surface)', borderRight: '1px solid var(--color-stone-border)' }}
      >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-3 border-b"
        style={{ height: '56px', borderColor: 'var(--color-stone-border)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--color-sun-yellow)', border: '1px solid var(--color-ink-black)' }}
        >
          <Building2 className="w-4 h-4 text-ink-black" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-ink-black text-sm font-extrabold tracking-tight leading-tight truncate">BRICKroots</span>
            <span className="text-[10px] leading-tight font-medium" style={{ color: 'var(--color-body-brown)' }}>Enterprise</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            {!sidebarCollapsed && (
              <p
                className="px-2 mb-1 text-xs font-semibold tracking-wider uppercase"
                style={{ color: 'var(--color-muted-gray)' }}
              >
                {group.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-buttons px-3 py-1.5 text-xs transition-colors duration-100',
                        isActive
                          ? 'font-semibold border border-stone-border'
                          : 'hover:text-ink-black hover:bg-cream-canvas/50 font-medium',
                        sidebarCollapsed && 'justify-center px-2'
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
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {!sidebarCollapsed && (
          <div className="mx-1 mt-4 p-3 rounded-cards border border-stone-border bg-stone-surface text-center relative overflow-hidden">
            <div className="flex justify-center mb-1.5">
              <Zap className="w-5 h-5 text-ember" />
            </div>
            <p className="text-[10px] font-bold text-heading-charcoal">Awesomic Grid</p>
            <p className="text-[9px] text-muted-gray leading-tight">Editorial zinc grid with ember punctuation.</p>
          </div>
        )}
      </nav>

      {/* User Profile */}
      {currentUser && (
        <div
          className="border-t p-2 flex items-center gap-2.5"
          style={{ borderColor: 'var(--color-stone-border)' }}
        >
          <Avatar name={currentUser.name} size="sm" className="flex-shrink-0" />
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ink-black truncate">{currentUser.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--color-muted-gray)' }}>
                {currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'sales_manager' ? 'Sales Manager' : 'Sales Executive'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-14 w-6 h-6 rounded-full flex items-center justify-center border transition-colors duration-100 z-10"
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
