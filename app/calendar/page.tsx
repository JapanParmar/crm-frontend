'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { PageHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { followUpsApi, siteVisitsApi, ApiFollowUp, ApiSiteVisit } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  MessageSquare,
  Building2,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

export default function CalendarPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // Fetch Follow-ups & Site Visits (agenda style, fetching last/next 50 items)
  const { data: followUpsData, isLoading: isLoadingFollowUps } = useQuery({
    queryKey: ['calendar-followups'],
    queryFn: () => followUpsApi.list({ limit: 100 }).then((r) => r.data.data),
  })

  const { data: siteVisitsData, isLoading: isLoadingSiteVisits } = useQuery({
    queryKey: ['calendar-sitevisits'],
    queryFn: () => siteVisitsApi.list({ limit: 100 }).then((r) => r.data.data),
  })

  const followUps = followUpsData ?? []
  const siteVisits = siteVisitsData ?? []

  // Generate calendar days for the currentMonth view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    
    const days: (Date | null)[] = []
    
    // Add null cells for previous month padding
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null)
    }
    
    // Add current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }, [currentMonth])

  // Map events to selected date
  const selectedDateEvents = useMemo(() => {
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)

    const dayFollowUps = followUps.filter((fu) => {
      const d = new Date(fu.scheduled_at)
      return d >= startOfDay && d <= endOfDay
    }).map((fu) => ({
      id: `fu-${fu.id}`,
      type: 'followup',
      time: new Date(fu.scheduled_at),
      title: `Follow-up: ${fu.type.toUpperCase()}`,
      lead: fu.lead,
      notes: fu.notes,
      status: fu.status,
      icon: <CalendarCheck className="w-3.5 h-3.5" />,
      assignedTo: fu.assigned_to,
      original: fu
    }))

    const daySiteVisits = siteVisits.filter((sv) => {
      const d = new Date(sv.scheduled_at)
      return d >= startOfDay && d <= endOfDay
    }).map((sv) => ({
      id: `sv-${sv.id}`,
      type: 'site_visit',
      time: new Date(sv.scheduled_at),
      title: `Site Visit: ${sv.project_name}`,
      lead: sv.lead,
      notes: sv.notes || sv.feedback || `Location: ${sv.location || 'Not specified'}`,
      status: sv.status,
      icon: <Building2 className="w-3.5 h-3.5" />,
      assignedTo: sv.attended_by,
      original: sv
    }))

    return [...dayFollowUps, ...daySiteVisits].sort((a, b) => a.time.getTime() - b.time.getTime())
  }, [selectedDate, followUps, siteVisits])

  // Count events for calendar dots
  const getEventCountForDate = (date: Date) => {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const fus = followUps.filter((fu) => {
      const d = new Date(fu.scheduled_at)
      return d >= start && d <= end
    }).length

    const svs = siteVisits.filter((sv) => {
      const d = new Date(sv.scheduled_at)
      return d >= start && d <= end
    }).length

    return fus + svs
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate()
  }

  const isLoading = isLoadingFollowUps || isLoadingSiteVisits

  return (
    <AppShell>
      <AppHeader title="Calendar" subtitle="Telemetry timeline & schedule" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />

      <main className="flex flex-col h-full bg-cream-canvas select-none" style={{ paddingTop: '56px' }}>
        <div className="bg-[#fcfbf9] border-b border-stone-surface sticky top-14 z-10">
          <PageHeader
            title="Schedule Calendar"
            description="Manage client engagements chronologically."
          />
        </div>

        <div className="flex-1 overflow-hidden p-5 flex flex-col md:flex-row gap-5 max-w-6xl mx-auto w-full h-[calc(100vh-170px)]">
          {/* Left Column: Interactive Mini Calendar */}
          <div className="w-full md:w-[320px] bg-white border border-stone-surface rounded-cards p-4 flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-heading-charcoal uppercase tracking-wider">
                {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded hover:bg-stone-surface text-muted-gray hover:text-ink-black transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded hover:bg-stone-surface text-muted-gray hover:text-ink-black transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-gray uppercase mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <div className="grid grid-cols-7 gap-1 flex-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />
                
                const isSelected = isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())
                const eventCount = getEventCountForDate(day)
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`h-9 w-full rounded-cards text-xs font-semibold flex flex-col items-center justify-between py-1 transition-all relative ${
                      isSelected
                        ? 'bg-ink-black text-white'
                        : isToday
                        ? 'border border-ink-black text-ink-black bg-stone-surface/30'
                        : 'hover:bg-stone-surface/50 text-body-brown'
                    }`}
                  >
                    <span>{day.getDate()}</span>
                    {eventCount > 0 && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-sun-yellow' : 'bg-ember'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Day Agenda */}
          <div className="flex-1 bg-white border border-stone-surface rounded-cards flex flex-col overflow-hidden h-full">
            {/* Header */}
            <div className="p-4 border-b border-stone-surface bg-[#fcfbf9] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-heading-charcoal">
                  Agenda for {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <p className="text-[10px] text-muted-gray mt-0.5">
                  {selectedDateEvents.length} scheduled event{selectedDateEvents.length !== 1 ? 's' : ''} on this day
                </p>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-stone-surface animate-pulse rounded-cards" />
                ))
              ) : selectedDateEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <CalendarIcon className="w-10 h-10 text-muted-gray/60 mb-3" />
                  <p className="text-xs font-bold text-heading-charcoal mb-0.5">No engagements scheduled</p>
                  <p className="text-[10px] text-muted-gray">Click other dates or schedule a new event from Leads page.</p>
                </div>
              ) : (
                selectedDateEvents.map((event) => {
                  const isScheduled = event.status === 'scheduled'
                  return (
                    <div
                      key={event.id}
                      className="p-3.5 rounded-cards border border-stone-surface hover:border-stone-border bg-white transition-all flex items-start gap-3 group"
                    >
                      <div className="w-7 h-7 rounded bg-stone-surface flex items-center justify-center flex-shrink-0 text-muted-gray">
                        {event.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-extrabold text-heading-charcoal">{event.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.25 rounded-badges border font-bold uppercase ${
                            event.status === 'completed'
                              ? 'bg-mint text-grass-green border-grass-green/20'
                              : event.status === 'missed'
                              ? 'bg-alert-red/5 text-alert-red border-alert-red/20'
                              : 'bg-stone-surface text-body-brown border-stone-border'
                          }`}>
                            {event.status}
                          </span>
                        </div>

                        {event.lead && (
                          <div className="flex items-center gap-1.5 text-xs text-body-brown mb-1 flex-wrap">
                            <span className="font-semibold text-heading-charcoal">Lead:</span>
                            <Link href={`/leads/${event.lead.id}`} className="hover:underline text-ink-black font-bold">
                              {event.lead.name}
                            </Link>
                            {event.lead.phone && <span className="text-muted-gray">({event.lead.phone})</span>}
                          </div>
                        )}

                        {event.notes && (
                          <p className="text-[11px] text-muted-gray italic bg-[#fcfbf9] border border-stone-surface p-1.5 rounded-cards mt-1.5 leading-relaxed">
                            "{event.notes}"
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-stone-surface/60">
                          <span className="flex items-center gap-1.5 text-[10px] text-body-brown">
                            <Clock className="w-3 h-3 text-muted-gray" />
                            {event.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {event.assignedTo && (
                            <span className="flex items-center gap-1.5 text-[10px] text-body-brown">
                              <Avatar name={event.assignedTo.name} size="xs" />
                              {event.assignedTo.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {isScheduled && event.lead?.phone && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={`tel:${event.lead.phone}`}
                            className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black"
                            title="Call Lead"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/91${event.lead.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-stone-surface text-body-brown hover:text-ink-black"
                            title="WhatsApp Lead"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
