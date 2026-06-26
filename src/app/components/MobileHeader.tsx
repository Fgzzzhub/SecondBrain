'use client'

import { usePathname } from 'next/navigation'
import { Brain } from 'lucide-react'

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/tasks': 'Tasks',
  '/timeline': 'Timeline',
  '/finance': 'Finance',
  '/finance/auto': 'Auto-Pilot',
  '/schedule': 'Schedule',
  '/notes': 'Notes',
  '/inventory': 'Inventory',
  '/settings': 'Settings',
  '/docs': 'Manual',
  '/forum': 'The Forum',
  '/cigarettes': 'Cigarettes',
  '/trips': 'Trips',
  '/subscriptions': 'Subscriptions',
  '/analytics': 'Analytics',
}

export function MobileHeader() {
  const pathname = usePathname()
  const title = routeTitles[pathname] || 'Brain OS'

  return (
    <header className="md:hidden fixed top-0 left-0 w-full h-14 glass border-b border-[var(--border)] flex items-center justify-between px-5 z-[10000]">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[rgba(var(--color-primary),0.18)] border border-[rgba(var(--color-primary),0.35)]">
          <Brain className="w-3 h-3 text-[rgb(var(--color-primary))] stroke-[1.75px]" />
        </div>
        <span className="font-semibold text-xs tracking-tight text-[var(--text-primary)]">Brain OS</span>
      </div>
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{title}</span>
      </div>
    </header>
  )
}
