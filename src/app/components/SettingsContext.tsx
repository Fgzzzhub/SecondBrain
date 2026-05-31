'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type AccentColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan'

export const accentColors: Record<AccentColor, { label: string; rgb: string; bgClass: string; hex: string }> = {
  indigo: { label: 'Indigo', rgb: '99, 102, 241', bgClass: 'bg-indigo-500', hex: '#6366f1' },
  emerald: { label: 'Emerald', rgb: '16, 185, 129', bgClass: 'bg-emerald-500', hex: '#10b981' },
  rose: { label: 'Rose', rgb: '244, 63, 94', bgClass: 'bg-rose-500', hex: '#f43f5e' },
  amber: { label: 'Amber', rgb: '245, 158, 11', bgClass: 'bg-amber-500', hex: '#f59e0b' },
  cyan: { label: 'Cyan', rgb: '6, 182, 212', bgClass: 'bg-cyan-500', hex: '#06b6d4' },
}

interface SettingsContextType {
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
  disabledModules: string[]
  toggleModule: (moduleId: string) => void
  isModuleEnabled: (moduleId: string) => boolean
  isHydrated: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>('indigo')
  const [disabledModules, setDisabledModules] = useState<string[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedAccent = localStorage.getItem('settings_accent_color') as AccentColor
    if (savedAccent && accentColors[savedAccent]) {
      setAccentColorState(savedAccent)
    }

    const savedDisabled = localStorage.getItem('settings_disabled_modules')
    if (savedDisabled) {
      try {
        setDisabledModules(JSON.parse(savedDisabled))
      } catch (e) {
        console.error(e)
      }
    }

    setIsHydrated(true)
  }, [])

  // Apply CSS Variable when accentColor changes
  useEffect(() => {
    const colorInfo = accentColors[accentColor]
    if (colorInfo) {
      document.documentElement.style.setProperty('--color-primary', colorInfo.rgb)
    }
  }, [accentColor])

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color)
    localStorage.setItem('settings_accent_color', color)
  }

  const toggleModule = (moduleId: string) => {
    setDisabledModules((prev) => {
      const isCurrentlyDisabled = prev.includes(moduleId)
      const next = isCurrentlyDisabled
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
      localStorage.setItem('settings_disabled_modules', JSON.stringify(next))
      return next
    })
  }

  const isModuleEnabled = (moduleId: string) => {
    return !disabledModules.includes(moduleId)
  }

  return (
    <SettingsContext.Provider
      value={{
        accentColor,
        setAccentColor,
        disabledModules,
        toggleModule,
        isModuleEnabled,
        isHydrated,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
