'use client'

import React, { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AppHeader } from '@/components/layout/AppHeader'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'
import { authApi } from '@/lib/api'
import { 
  Settings, 
  Paintbrush, 
  Briefcase, 
  Check, 
  Eye, 
  Sparkles
} from 'lucide-react'
import { Skeleton, LoadingSpinner, FullPageLoader } from '@/components/ui/skeleton'

export default function SettingsPage() {
  const { addLeadOpen, setAddLeadOpen } = useAppStore()
  const { 
    fontSize, setFontSize, 
    fontFamily, setFontFamily, 
    theme, setTheme, 
    customCanvasColor, setCustomCanvasColor,
    customSurfaceColor, setCustomSurfaceColor,
    customAccentColor, setCustomAccentColor,
    skeletonStyle, setSkeletonStyle 
  } = useAppStore()
  
  const addToast = useToastStore((s) => s.addToast)
  const [activeTab, setActiveTab] = useState<'appearance' | 'workspace'>('appearance')
  const [testingLoader, setTestingLoader] = useState(false)

  const savePrefs = async (updates: {
    fontSize?: typeof fontSize
    fontFamily?: typeof fontFamily
    theme?: typeof theme
    customCanvasColor?: string
    customSurfaceColor?: string
    customAccentColor?: string
    skeletonStyle?: typeof skeletonStyle
  }) => {
    // Calculate full updated preferences object
    const updatedPrefs = {
      fontSize: updates.fontSize ?? fontSize,
      fontFamily: updates.fontFamily ?? fontFamily,
      theme: updates.theme ?? theme,
      customCanvasColor: updates.customCanvasColor ?? customCanvasColor,
      customSurfaceColor: updates.customSurfaceColor ?? customSurfaceColor,
      customAccentColor: updates.customAccentColor ?? customAccentColor,
      skeletonStyle: updates.skeletonStyle ?? skeletonStyle,
    }

    const token = useAuthStore.getState().token
    const currentUser = useAuthStore.getState().user
    if (token && currentUser) {
      try {
        const response = await authApi.updatePreferences(updatedPrefs)
        if (response.data.success) {
          useAuthStore.getState().updateUser({
            ...currentUser,
            preferences: updatedPrefs
          })
        }
      } catch (err) {
        console.error('Failed to sync preferences to database:', err)
      }
    }
  }

  const triggerLoaderTest = () => {
    setTestingLoader(true)
    setTimeout(() => {
      setTestingLoader(false)
      addToast('Loader testing completed successfully!', 'success')
    }, 2000)
  }

  const themes = [
    { id: 'classic', name: 'Classic Light', bg: 'bg-[#ececee]', surface: 'bg-white', accent: 'bg-[#ff5a00]' },
    { id: 'dark', name: 'Obsidian Dark', bg: 'bg-[#09090a]', surface: 'bg-[#121215]', accent: 'bg-white' },
    { id: 'warm', name: 'Sunset Warmth', bg: 'bg-[#f6f1e5]', surface: 'bg-white', accent: 'bg-[#d97706]' },
    { id: 'mint', name: 'Nature Mint', bg: 'bg-[#e8f2ec]', surface: 'bg-white', accent: 'bg-[#198754]' },
    { id: 'indigo', name: 'Ocean Breeze', bg: 'bg-[#e2e8f0]', surface: 'bg-white', accent: 'bg-[#3b82f6]' },
    { id: 'custom', name: 'Custom Accent', bg: 'bg-stone-surface', surface: 'bg-white', accent: 'bg-gradient-to-tr from-rose-500 via-yellow-500 to-blue-500' },
  ] as const

  const fontFamilies = [
    { id: 'sans', name: 'DM Sans', fontClass: 'font-family-dm-sans' },
    { id: 'inter', name: 'Inter', fontClass: 'font-family-inter' },
    { id: 'outfit', name: 'Outfit', fontClass: 'font-family-outfit' },
    { id: 'jakarta', name: 'Plus Jakarta', fontClass: 'font-family-plus-jakarta' },
  ] as const

  const fontSizes = [
    { id: 'sm', name: 'Small', size: '14px' },
    { id: 'base', name: 'Medium (Default)', size: '16px' },
    { id: 'lg', name: 'Large', size: '18px' },
    { id: 'xl', name: 'Extra Large', size: '20px' },
  ] as const

  return (
    <AppShell>
      {testingLoader && <FullPageLoader />}
      
      <AppHeader title="Settings" subtitle="System configuration and preferences" />
      <AddLeadModal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} />
      
      <main className="flex-1 bg-cream-canvas p-6 overflow-y-auto select-none" style={{ paddingTop: '72px' }}>
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-stone-border gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'appearance'
                  ? 'border-ember text-heading-charcoal font-semibold'
                  : 'border-transparent text-muted-gray hover:text-heading-charcoal'
              }`}
            >
              <Paintbrush className="w-4 h-4" />
              Appearance & Styling
            </button>
            <button
              onClick={() => setActiveTab('workspace')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'border-ember text-heading-charcoal font-semibold'
                  : 'border-transparent text-muted-gray hover:text-heading-charcoal'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Workspace Settings
            </button>
          </div>

          {activeTab === 'appearance' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Theme Selection */}
                <div className="bg-white p-6 rounded-cards border border-stone-border shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="font-family-display text-sm font-semibold text-heading-charcoal">Color Theme</h3>
                    <p className="text-[11px] text-muted-gray mt-0.5">Choose a color palette for your workspace interface.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id)
                          savePrefs({ theme: t.id })
                          addToast(`Switched theme to ${t.name}`, 'info')
                        }}
                        className={`p-3 rounded-buttons border text-left flex flex-col gap-2 transition-all cursor-pointer relative hover:border-ember ${
                          theme === t.id 
                            ? 'border-ember ring-1 ring-ember bg-cream-canvas/30' 
                            : 'border-stone-border bg-stone-surface/30'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-semibold text-heading-charcoal">{t.name}</span>
                          {theme === t.id && <Check className="w-3.5 h-3.5 text-ember" />}
                        </div>
                        <div className="flex gap-1.5 mt-1">
                          <div className={`w-4 h-4 rounded-full border border-stone-border ${t.bg}`} title="Canvas background" />
                          <div className={`w-4 h-4 rounded-full border border-stone-border ${t.surface}`} title="Card background" />
                          <div className={`w-4 h-4 rounded-full border border-stone-border ${t.accent}`} title="Accent color" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Custom color pickers */}
                  {theme === 'custom' && (
                    <div className="border-t border-stone-border pt-4 mt-2 flex flex-col gap-4 animate-fadeIn">
                      <div>
                        <h4 className="text-xs font-semibold text-heading-charcoal">Custom Palette Configuration</h4>
                        <p className="text-[10px] text-muted-gray mt-0.5">Design your own layout scheme by selecting your three workspace colors.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Accent Color */}
                        <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-stone-border bg-stone-surface/35 min-w-0">
                          <span className="text-[11px] font-semibold text-heading-charcoal truncate">Accent/Brand Color</span>
                          <div className="flex items-center gap-2 w-full min-w-0">
                            <input
                              type="color"
                              value={customAccentColor}
                              onChange={(e) => setCustomAccentColor(e.target.value)}
                              onBlur={(e) => {
                                savePrefs({ customAccentColor: e.target.value })
                                addToast(`Custom accent color updated to ${e.target.value}`, 'success')
                              }}
                              className="w-8 h-8 rounded border border-stone-border cursor-pointer shrink-0 p-0"
                            />
                            <input
                              type="text"
                              value={customAccentColor}
                              onChange={(e) => {
                                const val = e.target.value
                                setCustomAccentColor(val)
                                if (val.length === 7 && val.startsWith('#')) {
                                  savePrefs({ customAccentColor: val })
                                }
                              }}
                              className="w-full min-w-0 h-8 px-2 rounded border border-stone-border text-xs text-heading-charcoal font-mono uppercase bg-white"
                              placeholder="#FF5A00"
                            />
                          </div>
                        </div>

                        {/* 2. Canvas Background */}
                        <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-stone-border bg-stone-surface/35 min-w-0">
                          <span className="text-[11px] font-semibold text-heading-charcoal truncate">Canvas Background</span>
                          <div className="flex items-center gap-2 w-full min-w-0">
                            <input
                              type="color"
                              value={customCanvasColor}
                              onChange={(e) => setCustomCanvasColor(e.target.value)}
                              onBlur={(e) => {
                                savePrefs({ customCanvasColor: e.target.value })
                                addToast(`Canvas color updated to ${e.target.value}`, 'success')
                              }}
                              className="w-8 h-8 rounded border border-stone-border cursor-pointer shrink-0 p-0"
                            />
                            <input
                              type="text"
                              value={customCanvasColor}
                              onChange={(e) => {
                                const val = e.target.value
                                setCustomCanvasColor(val)
                                if (val.length === 7 && val.startsWith('#')) {
                                  savePrefs({ customCanvasColor: val })
                                }
                              }}
                              className="w-full min-w-0 h-8 px-2 rounded border border-stone-border text-xs text-heading-charcoal font-mono uppercase bg-white"
                              placeholder="#F4F4F5"
                            />
                          </div>
                        </div>

                        {/* 3. Card/Surface Background */}
                        <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-stone-border bg-stone-surface/35 min-w-0">
                          <span className="text-[11px] font-semibold text-heading-charcoal truncate">Card/Surface Color</span>
                          <div className="flex items-center gap-2 w-full min-w-0">
                            <input
                              type="color"
                              value={customSurfaceColor}
                              onChange={(e) => setCustomSurfaceColor(e.target.value)}
                              onBlur={(e) => {
                                savePrefs({ customSurfaceColor: e.target.value })
                                addToast(`Surface color updated to ${e.target.value}`, 'success')
                              }}
                              className="w-8 h-8 rounded border border-stone-border cursor-pointer shrink-0 p-0"
                            />
                            <input
                              type="text"
                              value={customSurfaceColor}
                              onChange={(e) => {
                                const val = e.target.value
                                setCustomSurfaceColor(val)
                                if (val.length === 7 && val.startsWith('#')) {
                                  savePrefs({ customSurfaceColor: val })
                                }
                              }}
                              className="w-full min-w-0 h-8 px-2 rounded border border-stone-border text-xs text-heading-charcoal font-mono uppercase bg-white"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Font Family Selection */}
                <div className="bg-white p-6 rounded-cards border border-stone-border shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="font-family-display text-sm font-semibold text-heading-charcoal">Font Family</h3>
                    <p className="text-[11px] text-muted-gray mt-0.5">Set the main typography style for all text fields.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {fontFamilies.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setFontFamily(f.id)
                          savePrefs({ fontFamily: f.id })
                          addToast(`Font family changed to ${f.name}`, 'info')
                        }}
                        className={`p-3 rounded-buttons border text-left flex items-center justify-between transition-all cursor-pointer hover:border-ember ${f.fontClass} ${
                          fontFamily === f.id 
                            ? 'border-ember ring-1 ring-ember bg-cream-canvas/30' 
                            : 'border-stone-border bg-stone-surface/30'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-heading-charcoal">{f.name}</span>
                          <span className="text-[10px] text-muted-gray">Typography Preview</span>
                        </div>
                        {fontFamily === f.id && <Check className="w-3.5 h-3.5 text-ember" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size Selection */}
                <div className="bg-white p-6 rounded-cards border border-stone-border shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="font-family-display text-sm font-semibold text-heading-charcoal">Font Size</h3>
                    <p className="text-[11px] text-muted-gray mt-0.5">Scale the workspace interface text sizes for better reading density.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {fontSizes.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setFontSize(s.id)
                          savePrefs({ fontSize: s.id })
                          addToast(`Font size scaled to ${s.name}`, 'info')
                        }}
                        className={`py-2 px-3 rounded-buttons border text-center flex flex-col gap-0.5 transition-all cursor-pointer hover:border-ember ${
                          fontSize === s.id 
                            ? 'border-ember ring-1 ring-ember bg-cream-canvas/30' 
                            : 'border-stone-border bg-stone-surface/30'
                        }`}
                      >
                        <span className="text-xs font-semibold text-heading-charcoal">{s.name}</span>
                        <span className="text-[10px] text-muted-gray">{s.size}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skeleton & Loader Configuration */}
                <div className="bg-white p-6 rounded-cards border border-stone-border shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="font-family-display text-sm font-semibold text-heading-charcoal">Skeleton & Loading Style</h3>
                    <p className="text-[11px] text-muted-gray mt-0.5">Customize the look and animation style of skeleton loaders.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Shimmer selector */}
                    <button
                      onClick={() => {
                        setSkeletonStyle('shimmer')
                        savePrefs({ skeletonStyle: 'shimmer' })
                        addToast('Switched to Shimmer skeleton style', 'info')
                      }}
                      className={`p-4 rounded-buttons border text-left flex flex-col gap-3 transition-all cursor-pointer hover:border-ember ${
                        skeletonStyle === 'shimmer' 
                          ? 'border-ember ring-1 ring-ember bg-cream-canvas/30' 
                          : 'border-stone-border bg-stone-surface/30'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <span className="text-xs font-semibold text-heading-charcoal block">Premium Shimmer</span>
                          <span className="text-[10px] text-muted-gray">Animated linear gradient (Recommended)</span>
                        </div>
                        {skeletonStyle === 'shimmer' && <Check className="w-3.5 h-3.5 text-ember" />}
                      </div>
                      
                      {/* Live demo component */}
                      <div className="w-full h-8 bg-stone-surface rounded border border-stone-border p-2 flex flex-col gap-1.5 justify-center overflow-hidden">
                        <div className="skeleton-shimmer h-2 w-3/4 rounded" />
                        <div className="skeleton-shimmer h-1.5 w-1/2 rounded" />
                      </div>
                    </button>

                    {/* Pulse selector */}
                    <button
                      onClick={() => {
                        setSkeletonStyle('pulse')
                        savePrefs({ skeletonStyle: 'pulse' })
                        addToast('Switched to Pulse skeleton style', 'info')
                      }}
                      className={`p-4 rounded-buttons border text-left flex flex-col gap-3 transition-all cursor-pointer hover:border-ember ${
                        skeletonStyle === 'pulse' 
                          ? 'border-ember ring-1 ring-ember bg-cream-canvas/30' 
                          : 'border-stone-border bg-stone-surface/30'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <span className="text-xs font-semibold text-heading-charcoal block">Opacity Pulse</span>
                          <span className="text-[10px] text-muted-gray">Classic breathing opacity animation</span>
                        </div>
                        {skeletonStyle === 'pulse' && <Check className="w-3.5 h-3.5 text-ember" />}
                      </div>

                      {/* Live demo component */}
                      <div className="w-full h-8 bg-stone-surface rounded border border-stone-border p-2 flex flex-col gap-1.5 justify-center">
                        <div className="bg-cloud/90 dark:bg-stone-800 h-2 w-3/4 rounded animate-pulse" />
                        <div className="bg-cloud/90 dark:bg-stone-800 h-1.5 w-1/2 rounded animate-pulse" />
                      </div>
                    </button>
                    
                  </div>

                  {/* Testing Loaders triggers */}
                  <div className="border-t border-stone-border pt-4 mt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-heading-charcoal block">Test Loading Components</span>
                      <span className="text-[10px] text-muted-gray">Simulate data loading to preview animations live.</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={triggerLoaderTest}
                        className="flex-1 sm:flex-none text-xs font-semibold text-white bg-ember hover:opacity-90 active:scale-95 py-1.5 px-3 rounded-buttons cursor-pointer flex items-center justify-center gap-1.5 border-none"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Test Full-page Loader
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Preview Sandbox */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 bg-white p-6 rounded-cards border border-stone-border shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="font-family-display text-sm font-semibold text-heading-charcoal flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-ember" />
                    Live Sandbox Preview
                  </h3>
                  <p className="text-[11px] text-muted-gray">See exactly how your fonts, sizes, themes, and skeletons appear in context.</p>
                </div>
                
                {/* Mock Card Preview Container */}
                <div className="border border-stone-border rounded-cards p-5 bg-cream-canvas flex flex-col gap-4 relative overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-heading-charcoal">Lead Details (Demo)</h4>
                      <p className="text-[11px] text-body-brown">Assigned to: Rajesh Patel</p>
                    </div>
                    <span className="text-[10px] font-semibold text-white bg-ember px-2.5 py-0.5 rounded-badges uppercase">
                      New Lead
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-stone-border" />

                  {/* Mock Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-gray uppercase font-semibold">Contact Email</span>
                      <span className="text-body-brown font-medium break-all">amit.sharma@example.com</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-gray uppercase font-semibold">Budget Scale</span>
                      <span className="text-heading-charcoal font-bold">₹75,00,000</span>
                    </div>
                  </div>

                  {/* Skeleton loader preview in context */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-muted-gray uppercase font-semibold">Workspace Loading Preview</span>
                    <div className="flex flex-col gap-2 p-3 bg-white border border-stone-border rounded-cards shadow-sm">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>

                  {/* Micro element loaders */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-gray uppercase font-semibold">Active Loading Spinner:</span>
                    <div className="flex items-center gap-1.5 text-xs text-body-brown font-medium">
                      <LoadingSpinner size="sm" />
                      <span>Updating lead index...</span>
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="bg-stone-surface p-3.5 rounded-buttons border border-stone-border text-[11px] text-body-brown leading-relaxed">
                  <strong>💡 How does it work?</strong> Preferences are instantly applied to the DOM root. They are automatically saved using Zustand local storage middleware and will persist across browser reloads.
                </div>
              </div>

            </div>
          ) : (
            // Workspace Settings Tab (Under Development)
            <div className="bg-white rounded-cards border border-dashed border-stone-border p-12 text-center max-w-md mx-auto my-8">
              <div className="flex justify-center mb-4 text-ember">
                <Settings className="w-12 h-12 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <h2 className="font-family-display text-xl text-heading-charcoal tracking-tight mb-2">Workspace Settings</h2>
              <p className="text-xs text-body-brown leading-relaxed mb-4">
                Configure CRM team permissions, webhooks, integration channels (MagicBricks, Meta Ads API), automate lead scoring thresholds, and define custom property lead fields.
              </p>
              <span className="inline-block text-[10px] font-semibold text-white bg-ember px-2.5 py-0.5 rounded-badges uppercase">
                Under Development
              </span>
            </div>
          )}

        </div>
      </main>
    </AppShell>
  )
}
