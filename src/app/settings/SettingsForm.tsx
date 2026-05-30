'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { saveUserPreferences } from '@/app/actions'
import { Save, Eye, EyeOff, Sun, Moon, Laptop } from 'lucide-react'

interface Preferences {
  id: string
  user_name: string | null
  pomodoro_focus_time: number
  pomodoro_break_time: number
  hide_financial_balance: boolean
}

interface SettingsFormProps {
  initialPrefs: Preferences | null
}

export function SettingsForm({ initialPrefs }: SettingsFormProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hideBalance, setHideBalance] = useState(initialPrefs?.hide_financial_balance ?? false)
  const [successMsg, setSuccessMsg] = useState(false)

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-lg">
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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4 stroke-[2px]" />
        {loading ? 'Saving Preferences...' : 'Save Preferences'}
      </button>
    </form>
  )
}
