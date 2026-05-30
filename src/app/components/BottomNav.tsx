'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Sparkles, DollarSign, Menu, Calendar, StickyNote, Package, Settings, BookOpen, X } from 'lucide-react'

const primaryNav = [
  { icon: LayoutDashboard, label: "Home", href: "/" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: Sparkles, label: "Timeline", href: "/timeline" },
  { icon: DollarSign, label: "Finance", href: "/finance" },
]

const drawerNav = [
  { icon: Calendar, label: "Schedule", href: "/schedule" },
  { icon: StickyNote, label: "Notes", href: "/notes" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: BookOpen, label: "Manual", href: "/docs" },
]

export function BottomNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Reset visibility when navigating to a new page
  useEffect(() => {
    setIsVisible(true)
  }, [pathname])

  // Scroll detection inside the window with overscroll safeguards
  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const handleScroll = () => {
      // Safety: Never hide bottom nav when the drawer is open
      if (menuOpen) return

      const currentScrollY = window.scrollY
      
      // Absolute Top Safety Net: always show at the top
      if (currentScrollY <= 10) {
        setIsVisible(true)
      } 
      // Prevent hiding on negative scroll (iOS bounce / overscroll)
      else if (currentScrollY < 0) {
        setIsVisible(true)
      }
      // Normal scroll logic with a threshold to prevent micro-flickering
      else if (currentScrollY > lastScrollY + 5) {
        setIsVisible(false) // Scrolling down
      } 
      else if (currentScrollY < lastScrollY - 5) {
        setIsVisible(true)  // Scrolling up
      }

      lastScrollY = currentScrollY
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [menuOpen])

  // Lock document body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      {/* 5 Main Tabs - Fixed bottom with slide animation */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 w-full h-16 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-around px-2 z-[60] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {primaryNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5 text-center transition-colors"
            >
              <item.icon
                className={`w-4.5 h-4.5 transition-all ${
                  isActive && !menuOpen
                    ? 'text-neutral-900 dark:text-white scale-105 stroke-[2px]'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 stroke-[1.5px]'
                }`}
              />
              <span
                className={`text-[9px] transition-all font-medium ${
                  isActive && !menuOpen
                    ? 'text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Menu Tab */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5 text-center transition-colors cursor-pointer"
        >
          <Menu
            className={`w-4.5 h-4.5 transition-all ${
              menuOpen
                ? 'text-neutral-900 dark:text-white scale-105 stroke-[2px]'
                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 stroke-[1.5px]'
            }`}
          />
          <span
            className={`text-[9px] transition-all font-medium ${
              menuOpen
                ? 'text-neutral-900 dark:text-white font-semibold'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            More
          </span>
        </button>
      </nav>

      {/* Backdrop Overlay */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`md:hidden fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/60 z-[65] transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Bottom Sheet Drawer */}
      <div
        className={`md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 rounded-t-2xl z-[70] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] transition-all duration-300 transform ${
          menuOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
        }`}
      >
        {/* Drawer Handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
        </div>

        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">More modules</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4 stroke-[1.5px]" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {drawerNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center gap-2 ${
                  isActive
                    ? 'border-neutral-400 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-900 dark:text-white font-semibold'
                    : 'border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/20'
                }`}
              >
                <item.icon className="w-5 h-5 stroke-[1.5px] text-neutral-500 dark:text-neutral-400" />
                <span className="text-[10px] font-medium leading-none text-neutral-600 dark:text-neutral-400">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
