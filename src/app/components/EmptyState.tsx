'use client'

import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  message: string
  icon: LucideIcon
}

export function EmptyState({ message, icon: Icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/10 text-center gap-4 animate-in fade-in duration-300">
      <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 flex items-center justify-center">
        <Icon className="w-10 h-10 stroke-[1.25px]" />
      </div>
      <div className="flex flex-col gap-1 max-w-sm">
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-450 font-medium leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  )
}
