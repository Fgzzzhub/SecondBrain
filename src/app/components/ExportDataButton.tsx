'use client'

import { useState } from 'react'
import { Download, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ExportDataButton() {
  const [exporting, setExporting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to export data')

      // Fetch all tables in parallel
      const [notesRes, tasksRes, logsRes, inventoryRes] = await Promise.all([
        supabase.from('notes').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('learning_logs').select('*').eq('user_id', user.id),
        supabase.from('inventories').select('*').eq('user_id', user.id)
      ])

      if (notesRes.error) throw new Error(`Notes: ${notesRes.error.message}`)
      if (tasksRes.error) throw new Error(`Tasks: ${tasksRes.error.message}`)
      if (logsRes.error) throw new Error(`Learning Logs: ${logsRes.error.message}`)
      if (inventoryRes.error) throw new Error(`Inventory: ${inventoryRes.error.message}`)

      const exportPayload = {
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email
        },
        data: {
          notes: notesRes.data || [],
          tasks: tasksRes.data || [],
          learning_logs: logsRes.data || [],
          inventories: inventoryRes.data || []
        }
      }

      // Generate downloadable Blob
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `brain_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred during export')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-red-200/60 dark:border-red-950/30 bg-red-50/10 dark:bg-red-950/5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">Danger Zone</h3>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
            Export a full JSON backup containing all your notes, tasks, learning logs, and inventories.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 disabled:opacity-50 text-xs font-semibold transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2px]" />
          {exporting ? 'Gathering Data...' : 'Export All My Data'}
        </button>

        {success && (
          <p className="text-[10px] text-green-600 dark:text-green-400 font-medium text-center">
            Backup downloaded successfully! Keep this file secure.
          </p>
        )}

        {error && (
          <p className="text-[10px] text-red-600 dark:text-red-400 font-medium text-center">
            Export failed: {error}
          </p>
        )}
      </div>
    </div>
  )
}
