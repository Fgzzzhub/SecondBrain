'use client'

import { usePathname } from 'next/navigation'

const PAGE_LABELS: Record<string, string> = {
  '/':              'Home',
  '/finance':       'Finance',
  '/cigarettes':    'Cigarettes',
  '/trips':         'Trips',
  '/tasks':         'Tasks',
  '/notes':         'Notes',
  '/schedule':      'Schedule',
  '/analytics':     'Analytics',
  '/inventory':     'Inventory',
  '/subscriptions': 'Subscriptions',
  '/timeline':      'Timeline',
  '/forum':         'Forum',
  '/docs':          'Docs',
  '/settings':      'Settings',
  '/finance/auto':  'Auto Finance',
}

export function MobileHeader() {
  const pathname = usePathname()

  const label =
    PAGE_LABELS[pathname] ??
    Object.entries(PAGE_LABELS).find(
      ([key]) => key !== '/' && pathname.startsWith(key)
    )?.[1] ??
    'second-brain'

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        /* Fully transparent — no glass, no background */
        background: 'transparent',
      }}
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.92)',
          letterSpacing: '-0.03em',
          margin: 0,
          lineHeight: 1,
        }}
      >
        {label}
      </h1>
    </header>
  )
}
