'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { leadsApi } from '@/lib/api'
import {
  Search,
  X,
  ArrowRight,
  LayoutDashboard,
  Users,
  GitBranch,
  Calendar,
  PhoneCall,
  Building2,
  TrendingUp,
  Activity,
  ShieldAlert,
  Plus,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  action: () => void
  category: string
}

export function CommandPalette() {
  const router = useRouter()
  const { commandPaletteOpen, setCommandPaletteOpen, setAddLeadOpen } = useAppStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Listen for Cmd+K or Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  // Reset state when opening/closing
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [commandPaletteOpen])

  // Fetch leads based on search query
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['command-palette-leads', query],
    queryFn: () => leadsApi.list({ search: query, limit: 6 }).then((r) => r.data.data),
    enabled: query.trim().length > 0,
  })

  // Static Navigation & Action Shortcuts
  const defaultCommands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      subtitle: 'Overview of metrics & follow-ups',
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => { router.push('/'); setCommandPaletteOpen(false) },
      category: 'Navigation'
    },
    {
      id: 'nav-leads',
      title: 'Go to Leads List',
      subtitle: 'Browse & filter all lead records',
      icon: <Users className="w-4 h-4" />,
      action: () => { router.push('/leads'); setCommandPaletteOpen(false) },
      category: 'Navigation'
    },
    {
      id: 'nav-pipeline',
      title: 'Go to Sales Pipeline',
      subtitle: 'Kanban board of deals',
      icon: <GitBranch className="w-4 h-4" />,
      action: () => { router.push('/pipeline'); setCommandPaletteOpen(false) },
      category: 'Navigation'
    },
    {
      id: 'nav-calendar',
      title: 'Go to Calendar',
      subtitle: 'Timeline of schedule',
      icon: <Calendar className="w-4 h-4" />,
      action: () => { router.push('/calendar'); setCommandPaletteOpen(false) },
      category: 'Navigation'
    },
    {
      id: 'nav-followups',
      title: 'Go to Follow-ups Manager',
      subtitle: 'Pending follow-up actions',
      icon: <PhoneCall className="w-4 h-4" />,
      action: () => { router.push('/follow-ups'); setCommandPaletteOpen(false) },
      category: 'Navigation'
    },
    {
      id: 'nav-site-visits',
      title: 'Go to Site Visits Manager',
      subtitle: 'Property site visits scheduled',
      icon: <Building2 className="w-4 h-4" />,
      action: () => { router.push('/site-visits'); setCommandPaletteOpen(false) },
      category: 'Navigation'
    },
    {
      id: 'nav-team',
      title: 'Go to Team Management',
      subtitle: 'Administer sales staff members',
      icon: <Users className="w-4 h-4" />,
      action: () => { router.push('/team'); setCommandPaletteOpen(false) },
      category: 'Navigation'
    },
    {
      id: 'nav-reports',
      title: 'Go to Analytics Reports',
      subtitle: 'View sales yields & staff conversions',
      icon: <TrendingUp className="w-4 h-4" />,
      action: () => { router.push('/reports'); setCommandPaletteOpen(false) },
      category: 'Navigation'
    },
    {
      id: 'nav-activity',
      title: 'Go to Activity Feed',
      subtitle: 'CRM workspace audit log',
      icon: <Activity className="w-4 h-4" />,
      action: () => { router.push('/activity'); setCommandPaletteOpen(false) },
      category: 'Navigation'
    },
    {
      id: 'nav-rbac',
      title: 'Go to Access Control (RBAC)',
      subtitle: 'Roles & permissions configuration',
      icon: <ShieldAlert className="w-4 h-4" />,
      action: () => { router.push('/rbac'); setCommandPaletteOpen(false) },
      category: 'Navigation'
    },
    {
      id: 'action-create-lead',
      title: 'Create New Lead',
      subtitle: 'Add a new client to database',
      icon: <Plus className="w-4 h-4 text-ember" />,
      action: () => { setCommandPaletteOpen(false); setAddLeadOpen(true) },
      category: 'Quick Actions'
    }
  ]

  // Filter defaults locally if query is not empty but we want actions too
  const filteredDefaults = defaultCommands.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  )

  // Combined Items
  const items: CommandItem[] = query.trim().length > 0
    ? [
        ...searchResults.map((lead) => ({
          id: `lead-${lead.id}`,
          title: lead.name,
          subtitle: `Lead ID: ${lead.leadNumber} · Phone: ${lead.phone} · Status: ${lead.status}`,
          icon: <Users className="w-4 h-4 text-muted-gray" />,
          action: () => { router.push(`/leads/${lead.id}`); setCommandPaletteOpen(false) },
          category: 'Leads matching search'
        })),
        ...filteredDefaults
      ]
    : defaultCommands

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % items.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (items[selectedIndex]) {
          items[selectedIndex].action()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setCommandPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, items, selectedIndex, setCommandPaletteOpen])

  // Reset selected index when items list changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!commandPaletteOpen) return null

  // Group items by category for premium visual separation
  const categories: Record<string, CommandItem[]> = {}
  items.forEach((item) => {
    if (!categories[item.category]) categories[item.category] = []
    categories[item.category].push(item)
  })

  // Build sequential list of items to correctly match the selectedIndex across groups
  let itemCounter = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Main Panel */}
      <div
        ref={containerRef}
        className="relative w-full max-w-xl bg-white border border-stone-border rounded-cards shadow-premium overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 border-b border-stone-surface" style={{ height: '48px' }}>
          <Search className="w-4 h-4 text-muted-gray flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-0 outline-none text-xs text-heading-charcoal placeholder-muted-gray py-2 focus:ring-0 focus:outline-none"
            placeholder="Type a lead name, page name, or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && <Loader2 className="w-3.5 h-3.5 text-muted-gray animate-spin flex-shrink-0" />}
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded hover:bg-stone-surface text-muted-gray hover:text-ink-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-muted-gray/50 mx-auto mb-2" />
              <p className="text-xs font-bold text-heading-charcoal">No results found</p>
              <p className="text-[10px] text-muted-gray">We couldn't find anything matching "{query}"</p>
            </div>
          ) : (
            Object.entries(categories).map(([catName, catItems]) => (
              <div key={catName} className="space-y-0.5">
                <div className="px-3 py-1.5 text-[9px] font-extrabold text-muted-gray uppercase tracking-wider">
                  {catName}
                </div>
                {catItems.map((item) => {
                  const currentGlobalIndex = itemCounter++
                  const isCurrent = currentGlobalIndex === selectedIndex

                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-buttons text-left transition-all duration-75 group",
                        isCurrent
                          ? "bg-ink-black text-white"
                          : "hover:bg-stone-surface text-body-brown"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-7 h-7 rounded flex items-center justify-center flex-shrink-0 border",
                            isCurrent
                              ? "bg-white/10 border-white/20 text-white"
                              : "bg-[#fcfbf9] border-stone-surface text-muted-gray"
                          )}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-xs font-bold truncate", isCurrent ? "text-white" : "text-heading-charcoal")}>
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className={cn("text-[10px] truncate mt-0.5", isCurrent ? "text-white/70" : "text-muted-gray")}>
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight
                        className={cn(
                          "w-3.5 h-3.5 opacity-0 transition-opacity",
                          isCurrent ? "opacity-100 text-white" : "group-hover:opacity-100 text-muted-gray"
                        )}
                      />
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-[#fcfbf9] border-t border-stone-surface px-4 py-2 flex items-center justify-between text-[10px] text-muted-gray select-none">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="border border-stone-border bg-white rounded px-1 py-0.5 font-mono text-[9px] mr-1">↑↓</kbd>
              to navigate
            </span>
            <span>
              <kbd className="border border-stone-border bg-white rounded px-1 py-0.5 font-mono text-[9px] mr-1">Enter</kbd>
              to select
            </span>
            <span>
              <kbd className="border border-stone-border bg-white rounded px-1 py-0.5 font-mono text-[9px] mr-1">Esc</kbd>
              to close
            </span>
          </div>
          <span className="hidden sm:inline font-mono">
            Ctrl+K to toggle
          </span>
        </div>
      </div>
    </div>
  )
}
