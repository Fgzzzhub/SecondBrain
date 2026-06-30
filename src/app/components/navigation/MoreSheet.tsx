'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare,
  FileText,
  Calendar,
  BarChart2,
  Package,
  CreditCard,
  Clock,
  MessageCircle,
  BookOpen,
  Settings,
  Cpu,
  FileSearch,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { triggerHaptic } from '@/lib/haptic'

const MORE_ITEMS = [
  { href: '/tasks',        icon: CheckSquare,   label: 'Tasks',      iconColor: '#34D399', bgColor: '#064E3B' },
  { href: '/notes',        icon: FileText,      label: 'Notes',      iconColor: '#FCD34D', bgColor: '#451A03' },
  { href: '/schedule',     icon: Calendar,      label: 'Schedule',   iconColor: '#818CF8', bgColor: '#1E1B4B' },
  { href: '/analytics',    icon: BarChart2,     label: 'Analytics',  iconColor: '#C084FC', bgColor: '#2E1065' },
  { href: '/inventory',    icon: Package,       label: 'Inventory',  iconColor: '#38BDF8', bgColor: '#0C2A3E' },
  { href: '/subscriptions',icon: CreditCard,    label: 'Subs',       iconColor: '#F472B6', bgColor: '#3B0A2A' },
  { href: '/timeline',     icon: Clock,         label: 'Timeline',   iconColor: '#2DD4BF', bgColor: '#042F2E' },
  { href: '/forum',        icon: MessageCircle, label: 'Forum',      iconColor: '#FB923C', bgColor: '#431407' },
  { href: '/finance/auto', icon: Cpu,           label: 'Auto-Pilot', iconColor: '#A78BFA', bgColor: '#1E1B4B' },
  { href: '/recap',        icon: FileSearch,    label: 'Data Recap', iconColor: '#34D399', bgColor: '#064E3B' },
  { href: '/docs',         icon: BookOpen,      label: 'Docs',       iconColor: '#94A3B8', bgColor: '#1E293B' },
  { href: '/settings',     icon: Settings,      label: 'Settings',   iconColor: '#94A3B8', bgColor: '#1E293B' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  currentPath: string
}

export function MoreSheet({ isOpen, onClose, currentPath }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const isDraggingRef = useRef(false)
  const currentDeltaRef = useRef(0)

  // Drag-to-dismiss
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return

    const onTouchStart = (e: TouchEvent) => {
      startYRef.current = e.touches[0].clientY
      isDraggingRef.current = true
      currentDeltaRef.current = 0
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        currentDeltaRef.current = delta
        sheet.style.transform = `translateY(${delta}px) scale(${1 - delta * 0.0003})`
        sheet.style.transition = 'none'
      }
    }

    const onTouchEnd = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      sheet.style.transition = ''

      if (currentDeltaRef.current > 110) {
        onClose()
        sheet.style.transform = ''
      } else {
        sheet.style.transform = ''
      }
      currentDeltaRef.current = 0
    }

    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove', onTouchMove, { passive: true })
    sheet.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove', onTouchMove)
      sheet.removeEventListener('touchend', onTouchEnd)
    }
  }, [onClose])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleNavigate = (href: string) => {
    triggerHaptic(12)
    onClose()
    setTimeout(() => router.push(href), 200)
  }

  const handleSignOut = async () => {
    triggerHaptic(40)
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('settings_accent_color')
      localStorage.removeItem('settings_disabled_modules')
      document.documentElement.style.removeProperty('--color-primary')
      window.location.href = '/login'
    } catch (e) {
      console.error('Sign out error:', e)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`more-sheet-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`more-sheet ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="More pages"
      >
        {/* Drag handle */}
        <div className="more-sheet-handle" />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '16px',
            paddingLeft: '4px',
            paddingRight: '4px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.30)',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}
          >
            More Pages
          </span>

          {/* iOS-style close: circular ✕ button */}
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.45)',
              fontSize: '13px',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* App icon grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px 8px',
            padding: '0 4px',
          }}
        >
          {MORE_ITEMS.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href !== '/' && currentPath.startsWith(item.href + '/'))
            const Icon = item.icon

            return (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className={`more-grid-item ${isActive ? 'active' : ''}`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className="item-icon-wrap"
                  style={{ background: item.bgColor }}
                >
                  <Icon size={26} color={item.iconColor} strokeWidth={1.8} />
                </div>
                <span className="item-label">{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Sign Out */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '14px',
            borderTop: '0.5px solid rgba(255,255,255,0.07)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.28)',
              fontSize: '13px',
              fontWeight: 400,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              padding: '4px 14px',
            }}
          >
            <svg
              width="14" height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
