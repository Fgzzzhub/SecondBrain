'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Calendar, StickyNote, Sparkles, MessageSquare, DollarSign, Package, Settings, BookOpen, Cigarette, LineChart, Compass, CreditCard, Cpu } from 'lucide-react'

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
  Analytics: LineChart,
  Trips: Compass,
  Subscriptions: CreditCard,
  AutoPilot: Cpu
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
      { label: "Auto-Pilot", href: "/finance/auto", icon: "AutoPilot" },
      { label: "Cigarettes", href: "/cigarettes", icon: "Cigarettes" },
      { label: "Trips", href: "/trips", icon: "Trips" },
      { label: "Subscriptions", href: "/subscriptions", icon: "Subscriptions" },
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
  const primaryHrefs = ["/", "/finance", "/cigarettes", "/trips"]

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
            <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-wider mb-2 px-3">
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
                    className={`relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive
                        ? 'bg-[rgba(var(--color-primary),0.10)] text-[rgb(var(--color-primary))]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[rgb(var(--color-primary))]"
                      />
                    )}
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
