'use client'

import { useTransition } from 'react'
import { deleteLearningLog } from '@/app/actions'
import { Trash2, Loader2 } from 'lucide-react'

export function DeleteLogButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        if (confirm('Are you sure you want to delete this learning log?')) {
          startTransition(async () => {
            try {
              await deleteLearningLog(id)
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Failed to delete log')
            }
          })
        }
      }}
      disabled={isPending}
      className="text-neutral-400 hover:text-red-500 p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
      title="Delete log"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
      )}
    </button>
  )
}
