'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { saveUserPreferences } from '@/app/actions'
import { Save, Eye, EyeOff, Sun, Moon, Laptop, LogOut } from 'lucide-react'
import { useSettings, AccentColor } from '@/app/components/SettingsContext'
import { ExportDataButton } from '@/app/components/ExportDataButton'
import { createClient } from '@/lib/supabase/client'
import { triggerHaptic } from '@/lib/haptic'
import { User } from '@supabase/supabase-js'

interface Preferences {
  id: string
  user_name: string | null
  pomodoro_focus_time: number
  pomodoro_break_time: number
  hide_financial_balance: boolean
}

interface SettingsFormProps {
  initialPrefs: Preferences | null
  initialUser: User
}

export function SettingsForm({ initialPrefs, initialUser }: SettingsFormProps) {
  const { theme, setTheme } = useTheme()
  const { accentColor, setAccentColor, toggleModule, isModuleEnabled, isHydrated } = useSettings()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hideBalance, setHideBalance] = useState(initialPrefs?.hide_financial_balance ?? false)
  const [successMsg, setSuccessMsg] = useState(false)
  const supabase = createClient()

  // Profile name state
  const [displayName, setDisplayName] = useState(initialUser.user_metadata?.full_name || '')
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      alert('Display name cannot be empty')
      return
    }
    setUpdatingProfile(true)
    setProfileSuccess(false)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() }
      })
      if (error) throw error
      setProfileSuccess(true)
      triggerHaptic(30)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (e: any) {
      alert(e.message || 'Failed to update display name')
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleSignOut = async () => {
    triggerHaptic(50)
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('settings_accent_color')
      localStorage.removeItem('settings_disabled_modules')
      document.documentElement.style.removeProperty('--color-primary')
      window.location.href = '/login'
    } catch (e) {
      console.error('Error signing out:', e)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg(false)
    const formData = new FormData(e.currentTarget)
    formData.set('hide_financial_balance', hideBalance ? 'true' : 'false')

    try {
      await saveUserPreferences(formData)
      setSuccessMsg(true)
      setTimeout(() => setSuccessMsg(false), 3000)
    } catch (err) {
      alert('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {/* Profile Section */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Profile</h3>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal">Update your public display name for forum posts and comments.</p>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-medium">Public Display Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Friend"
              className="flex-1 bg-neutral-55 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-md p-2 outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
            />
            <button
              type="button"
              onClick={handleUpdateProfile}
              disabled={updatingProfile}
              className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 rounded-md text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {updatingProfile ? 'Saving...' : 'Save'}
            </button>
          </div>
          {profileSuccess && (
            <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-medium">Display name updated successfully!</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {successMsg && (
        <div className="p-3 text-xs bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium">
          Preferences saved successfully.
        </div>
      )}

      {/* General Settings */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">General</h3>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-medium">Display Name</label>
          <input
            type="text"
            name="user_name"
            defaultValue={initialPrefs?.user_name || ''}
            placeholder="Your name"
            className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-md p-2 outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
          />
        </div>
      </div>

      {/* Appearance / Theme Settings */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Appearance</h3>
        
        <div className="flex items-center justify-between py-1 gap-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Theme Mode</label>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Choose between light, dark, or system preferences.</p>
          </div>

          {mounted ? (
            <div className="flex gap-1 p-1 rounded-lg border border-neutral-200 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-950 transition-colors">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-2 rounded-md transition-all ${
                  theme === 'light'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm border border-neutral-200 dark:border-neutral-800'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 border border-transparent'
                }`}
                title="Light mode"
              >
                <Sun className="w-3.5 h-3.5 stroke-[1.5px]" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-md transition-all ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm border border-neutral-200 dark:border-neutral-800'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 border border-transparent'
                }`}
                title="Dark mode"
              >
                <Moon className="w-3.5 h-3.5 stroke-[1.5px]" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-2 rounded-md transition-all ${
                  theme === 'system'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm border border-neutral-200 dark:border-neutral-800'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 border border-transparent'
                }`}
                title="System preferences"
              >
                <Laptop className="w-3.5 h-3.5 stroke-[1.5px]" />
              </button>
            </div>
          ) : (
            <div className="h-9 w-32 bg-neutral-100 dark:bg-neutral-950 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      {/* Pomodoro Settings */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Pomodoro Timer Settings</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-medium">Focus Time (minutes)</label>
            <input
              type="number"
              name="pomodoro_focus_time"
              defaultValue={initialPrefs?.pomodoro_focus_time ?? 25}
              min="1"
              max="120"
              required
              className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-md p-2 outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-medium">Break Time (minutes)</label>
            <input
              type="number"
              name="pomodoro_break_time"
              defaultValue={initialPrefs?.pomodoro_break_time ?? 5}
              min="1"
              max="60"
              required
              className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-md p-2 outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Privacy settings */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Privacy & Display</h3>
        
        <div className="flex items-center justify-between py-1 gap-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Hide Financial Balance</label>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Obfuscate total money amounts on the finance dashboard.</p>
          </div>
          
          <button
            type="button"
            onClick={() => setHideBalance(!hideBalance)}
            className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
              hideBalance 
                ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' 
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'
            }`}
            title={hideBalance ? 'Show balance' : 'Hide balance'}
          >
            {hideBalance ? <EyeOff className="w-4 h-4 stroke-[1.5px]" /> : <Eye className="w-4 h-4 stroke-[1.5px]" />}
          </button>
        </div>
      </div>

      {/* Personalization (Accent Color) */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900">
        <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Accent Color</h3>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Customize the primary accent color for active items, buttons, and highlights.</p>
        
        <div className="flex gap-3 mt-1">
          {([
            { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
            { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
            { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
            { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
            { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500' },
          ] as const).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setAccentColor(c.id)}
              className={`w-8 h-8 rounded-full ${c.bg} transition-all relative flex items-center justify-center cursor-pointer shadow-sm ${
                accentColor === c.id
                  ? 'ring-2 ring-neutral-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 scale-110'
                  : 'hover:scale-105 opacity-80'
              }`}
              title={c.label}
            >
              {accentColor === c.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-900" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Module Toggles */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Active Modules</h3>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Toggle optional features to simplify and declutter your navigation feed.</p>
        </div>

        {isHydrated ? (
          <div className="flex flex-col gap-3.5 divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {([
              { id: 'schedule', label: 'Schedule', desc: 'Personal calendar and time management.' },
              { id: 'finance', label: 'Finance', desc: 'Track cashflow, balances, and analytics.' },
              { id: 'inventory', label: 'Inventory', desc: 'Track item quantities, locations, and conditions.' },
              { id: 'forum', label: 'Forum', desc: 'Share updates, links, and comments in a private feed.' },
              { id: 'docs', label: 'Manual', desc: 'Read help documentation and operating instructions.' },
            ] as const).map((mod, idx) => (
              <div
                key={mod.id}
                className={`flex items-center justify-between gap-4 ${idx > 0 ? 'pt-3.5' : ''}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{mod.label}</span>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal">{mod.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className={`relative inline-flex h-5.5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-205 ease-in-out focus:outline-none ${
                    isModuleEnabled(mod.id)
                      ? 'bg-[rgb(var(--color-primary))]'
                      : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isModuleEnabled(mod.id) ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-10 bg-neutral-100 dark:bg-neutral-950 rounded-lg" />
            <div className="h-10 bg-neutral-100 dark:bg-neutral-950 rounded-lg" />
            <div className="h-10 bg-neutral-100 dark:bg-neutral-950 rounded-lg" />
          </div>
        )}
      </div>

      <ExportDataButton />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4 stroke-[2px]" />
        {loading ? 'Saving Preferences...' : 'Save Preferences'}
      </button>
    </form>

      {/* Danger Zone: Log Out */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-red-500/20 dark:border-red-550/20 bg-red-500/5 dark:bg-red-500/5">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider">Danger Zone</h3>
          <p className="text-[10px] text-neutral-550 dark:text-neutral-400">Actions that affect your local session and configuration settings.</p>
        </div>
        
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-3 flex items-center justify-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 stroke-[1.5px]" />
          Log Out
        </button>
      </div>
    </div>
  )
}
