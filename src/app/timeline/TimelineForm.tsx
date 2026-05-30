'use client'

import { useRef, useTransition } from 'react'
import { createLearningLog } from '@/app/actions'
import { Plus, Loader2 } from 'lucide-react'

export function TimelineForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  const action = (formData: FormData) => {
    startTransition(async () => {
      try {
        await createLearningLog(formData)
        formRef.current?.reset()
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to create log')
      }
    })
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-none"
    >
      <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Document Learning</h3>
      
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <input
            type="text"
            name="title"
            placeholder="Today I learned..."
            required
            className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-md p-2.5 outline-none focus:border-neutral-400 dark:focus:border-neutral-650 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <textarea
            name="content"
            placeholder="Describe what you discovered, how it works, or why it matters..."
            required
            rows={3}
            className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-md p-2.5 outline-none focus:border-neutral-400 dark:focus:border-neutral-650 transition-colors resize-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <input
            type="text"
            name="tags"
            placeholder="react, webdev, database (comma-separated, optional)"
            className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-md p-2.5 outline-none focus:border-neutral-400 dark:focus:border-neutral-650 transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Plus className="w-3.5 h-3.5 stroke-[2px]" />
        )}
        {isPending ? 'Saving to Feed...' : 'Add to Timeline'}
      </button>
    </form>
  )
}
