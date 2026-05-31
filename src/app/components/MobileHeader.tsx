'use client'

import { usePathname } from 'next/navigation'
import { Brain } from 'lucide-react'

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/tasks': 'Tasks',
  '/timeline': 'Timeline',
  '/finance': 'Finance',
  '/schedule': 'Schedule',
  '/notes': 'Notes',
  '/inventory': 'Inventory',
  '/settings': 'Settings',
  '/docs': 'Manual',
  '/forum': 'The Forum',
}

export function MobileHeader() {
  const pathname = usePathname()
  const title = routeTitles[pathname] || 'Brain OS'

  return (
    <header className="md:hidden fixed top-0 left-0 w-full h-14 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/40 flex items-center justify-between px-6 z-50 transition-all shadow-none">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-neutral-900 dark:text-white stroke-[1.5px]" />
        <span className="font-semibold text-xs tracking-tight text-neutral-900 dark:text-white">Brain OS</span>
      </div>
      <div>
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-450 tracking-tight">{title}</span>
      </div>
    </header>
  )
}
