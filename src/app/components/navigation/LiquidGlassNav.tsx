'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Wallet,
  Cigarette,
  Plane,
  MoreHorizontal,
} from 'lucide-react'
import { triggerHaptic } from '@/lib/haptic'
import './liquid-glass.css'
import { MoreSheet } from './MoreSheet'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/',           icon: Home,      label: 'Home',    index: 0 },
  { href: '/finance',    icon: Wallet,    label: 'Finance', index: 1 },
  { href: '/cigarettes', icon: Cigarette, label: 'Rokok',   index: 2 },
  { href: '/trips',      icon: Plane,     label: 'Trips',   index: 3 },
]

type ScrollState = 'expanded' | 'shrunk'

export function LiquidGlassNav() {
  const pathname = usePathname()
  const router   = useRouter()

  const [scrollState, setScrollState] = useState<ScrollState>('expanded')
  const [isMoreOpen,  setIsMoreOpen]  = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending_review')

      setPendingCount(count || 0)
    }

    fetchCount()

    // Subscribe to transactions changes to update count in real-time
    const channel = supabase
      .channel('pending-tx-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        () => {
          fetchCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])


  const lastScrollY = useRef(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipingH  = useRef(false)
  const isTouching  = useRef(false)

  const currentIndex = NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  // ── Scroll: only expanded ↔ shrunk, never hidden ────────────
  useEffect(() => {
    const handleScroll = () => {
      if (isTouching.current || isMoreOpen) return

      const y     = window.scrollY
      const delta = y - lastScrollY.current

      if (y < 40) {
        setScrollState('expanded')
      } else if (delta > 6) {
        setScrollState('shrunk')
      } else if (delta < -6) {
        setScrollState('expanded')
      }

      lastScrollY.current = y
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMoreOpen])

  // ── Reset on route change ───────────────────────────────────
  useEffect(() => {
    setIsMoreOpen(false)
    setScrollState('expanded')
  }, [pathname])

  // ── Horizontal swipe between primary tabs ──────────────────
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      isSwipingH.current  = false
      isTouching.current  = true
    }
    const onTouchMove = (e: TouchEvent) => {
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
      if (dx > dy && dx > 12) isSwipingH.current = true
    }
    const onTouchEnd = (e: TouchEvent) => {
      isTouching.current = false
      if (!isSwipingH.current || isMoreOpen) return

      const dx        = e.changedTouches[0].clientX - touchStartX.current
      const threshold = window.innerWidth * 0.28
      if (Math.abs(dx) < threshold) return

      if (dx < 0 && currentIndex < NAV_ITEMS.length - 1) {
        navigateTo(NAV_ITEMS[currentIndex + 1].href, 'left')
      } else if (dx > 0 && currentIndex > 0) {
        navigateTo(NAV_ITEMS[currentIndex - 1].href, 'right')
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove',  onTouchMove,  { passive: true })
    document.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove',  onTouchMove)
      document.removeEventListener('touchend',   onTouchEnd)
    }
  }, [currentIndex, isMoreOpen])

  const navigateTo = useCallback((href: string, direction?: 'left' | 'right') => {
    if (direction) sessionStorage.setItem('nav-direction', direction)
    router.push(href)
  }, [router])

  const handleNavClick = (item: typeof NAV_ITEMS[0]) => {
    triggerHaptic(12)
    if (pathname === item.href) return
    const direction = item.index > currentIndex ? 'left' : 'right'
    navigateTo(item.href, direction)
  }

  const navClass = [
    'liquid-glass-nav',
    scrollState === 'shrunk' ? 'shrunk' : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      {/* SVG edge-refraction filter */}
      <svg
        width="0" height="0"
        style={{ position: 'absolute', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="lg-refract" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.6" numOctaves="2" stitchTiles="stitch" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* ── Pill nav ──────────────────────────────────────────── */}
      <nav
        className={navClass}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="lg-nav-row">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href + '/'))
            const Icon = item.icon

            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item)}
                className={`lg-nav-item ${isActive ? 'lg-active' : ''} relative`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className="lg-nav-icon"
                  size={21}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  color={isActive ? `rgb(var(--color-primary))` : 'rgba(255,255,255,0.44)'}
                />
                {item.label === 'Finance' && pendingCount > 0 && (
                  <span className="absolute top-1/2 left-1/2 -translate-x-[2px] -translate-y-[15px] bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center border border-neutral-900 shadow-sm animate-pulse z-[20]">
                    {pendingCount}
                  </span>
                )}
                <span className="lg-nav-label">{item.label}</span>
              </button>

            )
          })}

          {/* More button */}
          <button
            onClick={() => { triggerHaptic(12); setIsMoreOpen(true) }}
            className={`lg-nav-item ${isMoreOpen ? 'lg-active' : ''}`}
            aria-label="More"
            aria-expanded={isMoreOpen}
          >
            <MoreHorizontal
              className="lg-nav-icon"
              size={21}
              strokeWidth={isMoreOpen ? 2.2 : 1.7}
              color={isMoreOpen ? `rgb(var(--color-primary))` : 'rgba(255,255,255,0.44)'}
            />
            <span className="lg-nav-label">More</span>
          </button>
        </div>
      </nav>

      {/* ── More Sheet ────────────────────────────────────────── */}
      <MoreSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        currentPath={pathname}
      />
    </>
  )
}
