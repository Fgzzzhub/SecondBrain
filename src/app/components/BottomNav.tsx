'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Sparkles, StickyNote, Menu, X, LogOut } from 'lucide-react'
import { SidebarLinks } from './SidebarLinks'
import { triggerHaptic } from '@/lib/haptic'
import { createClient } from '@/lib/supabase/client'

const primaryNav = [
  { icon: LayoutDashboard, label: "Home", href: "/" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: Sparkles, label: "Timeline", href: "/timeline" },
  { icon: StickyNote, label: "Notes", href: "/notes" },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const handleSignOut = async () => {
    triggerHaptic(50)
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('settings_accent_color')
      localStorage.removeItem('settings_disabled_modules')
      document.documentElement.style.removeProperty('--color-primary')
      window.location.href = '/login'
    } catch (e) {
      console.error('Error signing out:', e)
    }
  }

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
        className={`md:hidden fixed bottom-0 left-0 w-full h-[calc(4rem+env(safe-area-inset-bottom))] bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-t border-neutral-200/50 dark:border-neutral-800/40 flex items-center justify-around px-2 z-[10000] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-in-out bottom-nav-container ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {primaryNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                triggerHaptic(15)
                setMenuOpen(false)
              }}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5 text-center transition-colors"
            >
              <item.icon
                className={`w-4.5 h-4.5 transition-all ${
                  isActive && !menuOpen
                    ? 'text-[rgb(var(--color-primary))] scale-105 stroke-[2px]'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 stroke-[1.5px]'
                }`}
              />
              <span
                className={`text-[9px] transition-all font-medium ${
                  isActive && !menuOpen
                    ? 'text-[rgb(var(--color-primary))] font-semibold'
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
          onClick={() => {
            triggerHaptic(15)
            setMenuOpen(!menuOpen)
          }}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5 text-center transition-colors cursor-pointer"
        >
          <Menu
            className={`w-4.5 h-4.5 transition-all ${
              menuOpen
                ? 'text-[rgb(var(--color-primary))] scale-105 stroke-[2px]'
                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 stroke-[1.5px]'
            }`}
          />
          <span
            className={`text-[9px] transition-all font-medium ${
              menuOpen
                ? 'text-[rgb(var(--color-primary))] font-semibold'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            Menu
          </span>
        </button>
      </nav>

      {/* Backdrop Overlay */}
      <div
        onClick={() => {
          triggerHaptic(10)
          setMenuOpen(false)
        }}
        className={`md:hidden fixed inset-0 bg-neutral-950/40 dark:bg-neutral-950/60 z-[10010] transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Bottom Sheet Drawer */}
      <div
        className={`md:hidden fixed bottom-0 left-0 w-full max-h-[75vh] bg-white/95 dark:bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-200/50 dark:border-neutral-800/40 rounded-t-2xl z-[10020] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] transition-all duration-300 transform flex flex-col gap-4 ${
          menuOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
        }`}
      >
        {/* Drawer Handle */}
        <div className="flex justify-center flex-shrink-0">
          <div className="w-10 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
        </div>

        <div className="flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">More Modules</span>
          <button
            onClick={() => {
              triggerHaptic(10)
              setMenuOpen(false)
            }}
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[1.5px]" />
          </button>
        </div>

        {/* Scrollable List container for drawer items using SidebarLinks style */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pr-1 pb-4">
          <SidebarLinks onLinkClick={() => {
            triggerHaptic(15)
            setMenuOpen(false)
          }} showOnlyDrawerItems={true} />
        </div>

        {/* Pinned Sign Out Section */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex-shrink-0">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-neutral-450 hover:text-red-500 hover:bg-red-500/5 dark:hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 stroke-[1.5px]" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
