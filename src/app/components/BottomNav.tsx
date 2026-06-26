'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, DollarSign, Cigarette, Compass, Menu, X, LogOut } from 'lucide-react'
import { SidebarLinks } from './SidebarLinks'
import { triggerHaptic } from '@/lib/haptic'
import { createClient } from '@/lib/supabase/client'

const primaryNav = [
  { icon: Home, label: "Home", href: "/" },
  { icon: DollarSign, label: "Finance", href: "/finance" },
  { icon: Cigarette, label: "Cigarettes", href: "/cigarettes" },
  { icon: Compass, label: "Trips", href: "/trips" },
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

  useEffect(() => {
    setIsVisible(true)
  }, [pathname])

  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const handleScroll = () => {
      if (menuOpen) return

      const currentScrollY = window.scrollY

      if (currentScrollY <= 10) {
        setIsVisible(true)
      } else if (currentScrollY < 0) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY + 5) {
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY - 5) {
        setIsVisible(true)
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
      {/* Glass bottom nav (mobile) */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 w-full h-[calc(4rem+env(safe-area-inset-bottom))] glass-strong border-t border-[var(--border-strong)] flex items-center justify-around px-2 z-[10000] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-in-out bottom-nav-container ${
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
              className="relative flex flex-col items-center justify-center gap-1 flex-1 py-1.5 text-center transition-colors"
            >
              {isActive && !menuOpen && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[rgb(var(--color-primary))]"
                />
              )}
              <item.icon
                className={`w-[18px] h-[18px] transition-all ${
                  isActive && !menuOpen
                    ? 'text-[rgb(var(--color-primary))] scale-110 stroke-[2px]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] stroke-[1.5px]'
                }`}
              />
              <span
                className={`text-[9px] transition-all font-medium ${
                  isActive && !menuOpen
                    ? 'text-[rgb(var(--color-primary))] font-semibold'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        <button
          onClick={() => {
            triggerHaptic(15)
            setMenuOpen(!menuOpen)
          }}
          className="relative flex flex-col items-center justify-center gap-1 flex-1 py-1.5 text-center transition-colors cursor-pointer"
        >
          {menuOpen && (
            <span
              aria-hidden="true"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[rgb(var(--color-primary))]"
            />
          )}
          <Menu
            className={`w-[18px] h-[18px] transition-all ${
              menuOpen
                ? 'text-[rgb(var(--color-primary))] scale-110 stroke-[2px]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] stroke-[1.5px]'
            }`}
          />
          <span
            className={`text-[9px] transition-all font-medium ${
              menuOpen
                ? 'text-[rgb(var(--color-primary))] font-semibold'
                : 'text-[var(--text-secondary)]'
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
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[10010] transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Bottom Sheet Drawer */}
      <div
        className={`md:hidden fixed bottom-0 left-0 w-full max-h-[80vh] glass-strong rounded-t-3xl z-[10020] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] transition-transform duration-300 transform flex flex-col gap-4 ${
          menuOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
        }`}
      >
        <div className="flex justify-center flex-shrink-0">
          <div className="w-12 h-1 bg-[var(--border-strong)] rounded-full" />
        </div>

        <div className="flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">More Modules</span>
          <button
            onClick={() => {
              triggerHaptic(10)
              setMenuOpen(false)
            }}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[1.5px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pr-1 pb-4">
          <SidebarLinks onLinkClick={() => {
            triggerHaptic(15)
            setMenuOpen(false)
          }} showOnlyDrawerItems={true} />
        </div>

        <div className="pt-4 border-t border-[var(--border)] flex-shrink-0">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[rgba(239,68,68,0.08)] border border-transparent hover:border-[rgba(239,68,68,0.25)] text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 stroke-[1.5px]" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
