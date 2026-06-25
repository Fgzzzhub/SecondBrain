'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, CreditCard, Loader2 } from 'lucide-react'
import { paySubscription } from '@/app/actions'

interface Subscription {
  id: string
  name: string
  amount: number
  billing_day: number
  wallet_name: string
  created_at: string
}

interface SubscriptionAlertsProps {
  initialSubscriptions: Subscription[]
}

function getDaysRemaining(billingDay: number): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

  let targetYear = today.getFullYear()
  let targetMonth = today.getMonth()
  let maxDay = getDaysInMonth(targetYear, targetMonth)
  let targetDay = Math.min(billingDay, maxDay)

  let targetDate = new Date(targetYear, targetMonth, targetDay)

  if (targetDate < today) {
    targetMonth += 1
    maxDay = getDaysInMonth(targetYear, targetMonth)
    targetDay = Math.min(billingDay, maxDay)
    targetDate = new Date(targetYear, targetMonth, targetDay)
  }

  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function SubscriptionAlerts({ initialSubscriptions }: SubscriptionAlertsProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Filter subscriptions due in <= 5 days
  useEffect(() => {
    const dueSubs = initialSubscriptions.filter(sub => {
      const days = getDaysRemaining(sub.billing_day)
      return days <= 5
    })
    setSubscriptions(dueSubs)
  }, [initialSubscriptions])

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handlePay = async (sub: Subscription) => {
    if (loadingId) return
    setLoadingId(sub.id)

    try {
      await paySubscription(sub.id)
      
      // Toast notification
      setToast({
        message: `Berhasil membayar tagihan ${sub.name} senilai Rp ${sub.amount.toLocaleString('id-ID')} via ${sub.wallet_name}!`,
        type: 'success'
      })

      // Smoothly remove from alert list
      setSubscriptions(prev => prev.filter(s => s.id !== sub.id))
    } catch (err: any) {
      console.error(err)
      setToast({
        message: `Gagal membayar tagihan: ${err?.message || err}`,
        type: 'error'
      })
    } finally {
      setLoadingId(null)
    }
  }

  if (subscriptions.length === 0) return null

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border border-neutral-250 dark:border-neutral-800 bg-neutral-950 dark:bg-neutral-900 text-white shadow-2xl text-xs font-medium w-[90%] max-w-md"
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className="flex-1 truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {subscriptions.map(sub => {
          const daysLeft = getDaysRemaining(sub.billing_day)
          const daysText = daysLeft === 0 ? 'hari ini' : `${daysLeft} hari`

          return (
            <motion.div
              key={sub.id}
              layout
              initial={{ opacity: 0, height: 0, y: 15 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -15, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full border border-rose-500/20 dark:border-rose-550/20 rounded-2xl p-4 sm:p-5 bg-rose-50/20 dark:bg-rose-950/5 backdrop-blur-md shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Subtle background red light */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-rose-100/50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-450 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                    Jatuh Tempo
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 mt-2 font-normal leading-relaxed">
                    ⚠️ Tagihan <strong className="font-semibold text-neutral-900 dark:text-white">{sub.name}</strong> senilai <strong className="font-semibold text-neutral-900 dark:text-white">Rp {sub.amount.toLocaleString('id-ID')}</strong> via <strong className="font-semibold text-neutral-900 dark:text-white">{sub.wallet_name}</strong> jatuh tempo dalam <strong className="font-semibold text-rose-600 dark:text-rose-400">{daysText}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center shrink-0 pl-13 sm:pl-0">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePay(sub)}
                  disabled={loadingId !== null}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-900 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {loadingId === sub.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>💸 Bayar Sekarang</span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
