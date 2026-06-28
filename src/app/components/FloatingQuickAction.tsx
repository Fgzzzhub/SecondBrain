'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Bot, CheckSquare, Cigarette, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ACTIONS = [
  {
    id: 'ai',
    icon: Bot,
    label: 'Tanya AI',
    iconColor: '#818CF8',
    iconBg: 'rgba(99,102,241,0.28)',
  },
  {
    id: 'task',
    icon: CheckSquare,
    label: 'Tambah Task',
    iconColor: '#34D399',
    iconBg: 'rgba(16,185,129,0.28)',
  },
  {
    id: 'smoke',
    icon: Cigarette,
    label: 'Log Rokok',
    iconColor: '#FCD34D',
    iconBg: 'rgba(245,158,11,0.28)',
  },
  {
    id: 'transaction',
    icon: Wallet,
    label: 'Catat Transaksi',
    iconColor: '#6366F1',
    iconBg: 'rgba(99,102,241,0.28)',
  },
]

export function FloatingQuickAction() {
  const [isOpen, setIsOpen] = useState(false)
  const [smokeToast, setSmokeToast] = useState(false)
  const router = useRouter()
  const fabRef = useRef<HTMLDivElement>(null)

  // Close on outside tap
  useEffect(() => {
    if (!isOpen) return
    const handle = (e: MouseEvent | TouchEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [isOpen])

  // Lock body scroll saat open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleAction = async (id: string) => {
    setIsOpen(false)
    await new Promise(r => setTimeout(r, 160))

    switch (id) {
      case 'ai':
        // Buka AIChatDrawer — sesuaikan dengan cara yang sudah ada di project
        // Cek AIChatDrawer.tsx untuk cara trigger-nya (state, context, atau event)
        document.dispatchEvent(new CustomEvent('open-ai-chat'))
        break
      case 'task':
        router.push('/tasks?quick=true')
        break
      case 'smoke':
        await logSmoke()
        break
      case 'transaction':
        router.push('/finance?quick=true')
        break
    }
  }

  const logSmoke = async () => {
    try {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      const { data: existing } = await supabase
        .from('cigarettes_log')
        .select('id, count')
        .eq('date', today)
        .single()

      if (existing) {
        await supabase
          .from('cigarettes_log')
          .update({ count: existing.count + 1 })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('cigarettes_log')
          .insert({ date: today, count: 1 })
      }

      setSmokeToast(true)
      setTimeout(() => setSmokeToast(false), 2200)
    } catch (err) {
      console.error('Log smoke error:', err)
    }
  }

  return (
    <>
      {/* Full-screen backdrop blur saat open */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 85,
          backdropFilter: isOpen ? 'blur(6px)' : 'blur(0px)',
          WebkitBackdropFilter: isOpen ? 'blur(6px)' : 'blur(0px)',
          background: isOpen ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          transition: 'opacity 0.3s ease, backdrop-filter 0.35s ease',
        }}
        onClick={() => setIsOpen(false)}
      />

      {/* FAB wrapper */}
      <div
        ref={fabRef}
        style={{
          position: 'fixed',
          right: '20px',
          // ✅ CLEAR dari navbar: 88px tinggi navbar + 16px gap
          bottom: 'calc(88px + 16px)',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '10px',
        }}
      >
        {/* Action items — spring stagger dari bawah ke atas */}
        {ACTIONS.map((action, index) => {
          const Icon = action.icon
          // Item paling bawah (index terakhir) muncul duluan
          const reverseIndex = ACTIONS.length - 1 - index
          const openDelay = `${reverseIndex * 0.055}s`
          const closeDelay = `${index * 0.03}s`

          return (
            <div
              key={action.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'flex-end',
                opacity: isOpen ? 1 : 0,
                transform: isOpen
                  ? 'translateY(0) scale(1)'
                  : 'translateY(20px) scale(0.82)',
                transition: isOpen
                  ? `opacity 0.3s ease ${openDelay}, transform 0.45s cubic-bezier(0.34,1.56,0.64,1) ${openDelay}`
                  : `opacity 0.18s ease ${closeDelay}, transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94) ${closeDelay}`,
                pointerEvents: isOpen ? 'all' : 'none',
              }}
            >
              {/* Label pill — liquid glass */}
              <button
                onClick={() => handleAction(action.id)}
                style={{
                  position: 'relative',
                  height: '40px',
                  padding: '0 18px',
                  borderRadius: '20px',

                  // Liquid glass material
                  background: 'rgba(22, 24, 40, 0.78)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',

                  border: '0.5px solid rgba(255,255,255,0.13)',
                  borderTop: '0.5px solid rgba(255,255,255,0.20)',

                  boxShadow: `
                    0 4px 20px rgba(0,0,0,0.4),
                    0 1px 0 rgba(255,255,255,0.07) inset
                  `,

                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.94)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.94)')}
                onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {/* Specular highlight line */}
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: '15%',
                  right: '15%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28) 50%, transparent)',
                  pointerEvents: 'none',
                }} />

                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.88)',
                  letterSpacing: '-0.01em',
                }}>
                  {action.label}
                </span>
              </button>

              {/* Icon circle — liquid glass */}
              <button
                onClick={() => handleAction(action.id)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  flexShrink: 0,

                  background: action.iconBg,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',

                  border: `0.5px solid ${action.iconColor}28`,
                  borderTop: `0.5px solid ${action.iconColor}45`,

                  boxShadow: `
                    0 4px 14px rgba(0,0,0,0.35),
                    0 1px 0 rgba(255,255,255,0.10) inset
                  `,

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.88)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.88)')}
                onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {/* Specular arc di atas icon circle */}
                <span style={{
                  position: 'absolute',
                  top: '5px',
                  left: '20%',
                  right: '20%',
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${action.iconColor}60 50%, transparent)`,
                  pointerEvents: 'none',
                }} />
                <Icon size={17} color={action.iconColor} strokeWidth={2} />
              </button>
            </div>
          )
        })}

        {/* Main FAB — liquid glass */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',

            // Liquid glass — warna berubah saat open
            background: isOpen
              ? 'rgba(35, 37, 58, 0.88)'
              : 'rgba(99, 102, 241, 0.88)',
            backdropFilter: 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%)',

            border: '0.5px solid rgba(255,255,255,0.18)',
            borderTop: '0.5px solid rgba(255,255,255,0.30)',

            boxShadow: isOpen
              ? `0 4px 20px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.08) inset`
              : `0 4px 24px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.20), 0 1px 0 rgba(255,255,255,0.22) inset`,

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            transition: 'background 0.35s ease, box-shadow 0.35s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.88)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.88)')}
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
          aria-label={isOpen ? 'Close' : 'Quick actions'}
          aria-expanded={isOpen}
        >
          {/* Specular highlight di atas FAB */}
          <span style={{
            position: 'absolute',
            top: '7px',
            left: '22%',
            right: '22%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45) 50%, transparent)',
            pointerEvents: 'none',
          }} />

          {/* Plus icon — rotate jadi × saat open */}
          <div style={{
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Plus size={22} color="rgba(255,255,255,0.96)" strokeWidth={2.5} />
          </div>
        </button>

        {/* Smoke toast */}
        {smokeToast && (
          <div style={{
            position: 'absolute',
            bottom: '64px',
            right: 0,
            background: 'rgba(22,24,40,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(255,255,255,0.10)',
            borderTop: '0.5px solid rgba(255,255,255,0.18)',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.85)',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'fabToastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            🚬 +1 dicatat
          </div>
        )}
      </div>

      <style>{`
        @keyframes fabToastIn {
          from { opacity: 0; transform: translateY(8px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
