'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Loader2, CheckCircle2 } from 'lucide-react'
import { ensureServiceWorker, isPushSupported, subscribeToPush } from '@/lib/push'
import { useQuickAction } from './QuickActionProvider'

const STORAGE_KEY = 'notif_prompt_dismissed_at'
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 14 // 14 days

export function NotificationPrompt() {
  const { toast } = useQuickAction()
  const [show, setShow] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) return
    // Keep the SW registered on every load so existing subscriptions keep
    // receiving pushes (next-pwa used to handle this automatically).
    void ensureServiceWorker()
    if (Notification.permission === 'granted') return // already subscribed (probably)
    if (Notification.permission === 'denied') return // blocked — don't nag

    const dismissedAt = Number(localStorage.getItem(STORAGE_KEY) || 0)
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return

    // Show after a short delay so it doesn't interrupt initial render
    const t = setTimeout(() => setShow(true), 1500)
    return () => clearTimeout(t)
  }, [])

  const enable = async () => {
    setPending(true)
    const result = await subscribeToPush()
    setPending(false)
    if (result.ok) {
      toast('🔔 Notifikasi pagi aktif!', 'success')
      setShow(false)
    } else {
      toast(`❌ ${result.reason}`, 'error')
    }
  }

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[10075] w-[min(92vw,360px)]"
        >
          <div className="rounded-2xl glass-strong border border-[var(--border-strong)] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[rgba(var(--color-primary),0.14)] border border-[rgba(var(--color-primary),0.30)]">
                <Bell className="w-4 h-4 text-[rgb(var(--color-primary))] stroke-[1.75px]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                  Briefing pagi otomatis
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Ringkasan saldo, rokok, dan task tiap pagi jam 07:00 WIB.
                </p>
              </div>
              <button
                onClick={dismiss}
                aria-label="Tutup"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md flex-shrink-0 transition-colors"
              >
                <X className="w-3.5 h-3.5 stroke-[1.5px]" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={enable}
                disabled={pending}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[rgb(var(--color-primary))] text-white text-xs font-semibold shadow-glow hover:shadow-glow-strong transition-all disabled:opacity-60 disabled:shadow-none"
              >
                {pending ? (
                  <Loader2 className="w-3.5 h-3.5 stroke-[2px] animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.75px]" />
                )}
                Aktifkan
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                Nanti
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
