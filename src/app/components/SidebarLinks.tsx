'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Calendar, StickyNote, Sparkles, MessageSquare, DollarSign, Package, Settings, BookOpen, Cigarette, LineChart } from 'lucide-react'

// All icons mapped
export const iconMap = {
  Home: LayoutDashboard,
  Tasks: CheckSquare,
  Schedule: Calendar,
  Notes: StickyNote,
  Timeline: Sparkles,
  Forum: MessageSquare,
  Finance: DollarSign,
  Inventory: Package,
  Settings: Settings,
  Manual: BookOpen,
  Cigarettes: Cigarette,
  Analytics: LineChart
}

export const navGroups = [
  {
    title: "WORKSPACE",
    items: [
      { label: "Home", href: "/", icon: "Home" },
      { label: "Tasks", href: "/tasks", icon: "Tasks" },
      { label: "Schedule", href: "/schedule", icon: "Schedule" },
    ]
  },
  {
    title: "KNOWLEDGE",
    items: [
      { label: "Notes", href: "/notes", icon: "Notes" },
      { label: "Timeline", href: "/timeline", icon: "Timeline" },
    ]
  },
  {
    title: "LOGISTICS",
    items: [
      { label: "Finance", href: "/finance", icon: "Finance" },
      { label: "Cigarettes", href: "/cigarettes", icon: "Cigarettes" },
      { label: "Analytics", href: "/analytics", icon: "Analytics" },
      { label: "Inventory", href: "/inventory", icon: "Inventory" },
    ]
  },
  {
    title: "NETWORK",
    items: [
      { label: "Forum", href: "/forum", icon: "Forum" },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Manual", href: "/docs", icon: "Manual" },
      { label: "Settings", href: "/settings", icon: "Settings" },
    ]
  }
]

import { useSettings } from './SettingsContext'

interface SidebarLinksProps {
  onLinkClick?: () => void
  showOnlyDrawerItems?: boolean
}

export function SidebarLinks({ onLinkClick, showOnlyDrawerItems = false }: SidebarLinksProps) {
  const pathname = usePathname()
  const { isModuleEnabled, isHydrated } = useSettings()

  // Primary tabs (displayed directly in the bottom nav)
  const primaryHrefs = ["/", "/finance", "/cigarettes", "/tasks"]

  const isEnabled = (href: string) => {
    if (href === '/schedule') return isModuleEnabled('schedule')
    if (href === '/finance') return isModuleEnabled('finance')
    if (href === '/inventory') return isModuleEnabled('inventory')
    if (href === '/forum') return isModuleEnabled('forum')
    if (href === '/docs') return isModuleEnabled('docs')
    return true
  }

  return (
    <div className="flex flex-col gap-6">
      {navGroups.map((group) => {
        // Filter items
        let itemsToRender = showOnlyDrawerItems
          ? group.items.filter(item => !primaryHrefs.includes(item.href))
          : group.items

        if (isHydrated) {
          itemsToRender = itemsToRender.filter(item => isEnabled(item.href))
        }

        if (itemsToRender.length === 0) return null

        return (
          <div key={group.title} className="flex flex-col">
            <span className="text-[10px] font-semibold text-neutral-450 dark:text-neutral-500 tracking-wider mb-2 px-3">
              {group.title}
            </span>
            <nav className="flex flex-col gap-1">
              {itemsToRender.map((item) => {
                const isActive = pathname === item.href
                const Icon = iconMap[item.icon as keyof typeof iconMap]

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all border-l-2 ${
                      isActive
                        ? 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/50 border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 stroke-[1.5px] ${isActive ? 'text-[rgb(var(--color-primary))]' : ''}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )
      })}
    </div>
  )
}
