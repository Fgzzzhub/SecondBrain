'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Calendar, AlertTriangle, Plus, Trash2, CheckCircle, Loader2, DollarSign, Wallet } from 'lucide-react'
import { createSubscription, deleteSubscription, paySubscription } from '@/app/actions'
import { AnimatedSelect } from '@/app/components/ui/AnimatedSelect'

interface Subscription {
  id: string
  name: string
  amount: number
  billing_day: number
  wallet_name: string
  created_at: string
}

interface SubscriptionManagerProps {
  initialSubscriptions: Subscription[]
}

const walletOptions = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Gopay', label: 'Gopay' },
  { value: 'Dana', label: 'Dana' },
  { value: 'Livin', label: 'Livin' },
  { value: 'Ovo', label: 'Ovo' },
  { value: 'Ovo', label: 'Ovo' } // duplicate check - we keep clean list
]

const cleanWalletOptions = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Gopay', label: 'Gopay' },
  { value: 'Dana', label: 'Dana' },
  { value: 'Livin', label: 'Livin' },
  { value: 'Ovo', label: 'Ovo' },
  { value: 'BCA', label: 'BCA / Mandiri' }
]

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

export function SubscriptionManager({ initialSubscriptions }: SubscriptionManagerProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions)
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingDay, setBillingDay] = useState('')
  const [walletName, setWalletName] = useState('Gopay')
  
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Sync state with props
  useEffect(() => {
    setSubscriptions(initialSubscriptions)
  }, [initialSubscriptions])

  // Toast timeout
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0)

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount || !billingDay) return

    const dayNum = parseInt(billingDay)
    if (dayNum < 1 || dayNum > 31) {
      setToast({ message: 'Billing day must be between 1 and 31', type: 'error' })
      return
    }

    startTransition(async () => {
      try {
        const amtNum = parseFloat(amount)
        // Add optimistic ID for smooth transition
        const tempId = Math.random().toString()
        const newSub: Subscription = {
          id: tempId,
          name,
          amount: amtNum,
          billing_day: dayNum,
          wallet_name: walletName,
          created_at: new Date().toISOString()
        }

        setSubscriptions(prev => [newSub, ...prev])
        setIsAdding(false)
        setName('')
        setAmount('')
        setBillingDay('')

        await createSubscription(name, amtNum, dayNum, walletName)
        setToast({ message: `Successfully added ${name}!`, type: 'success' })
      } catch (err: any) {
        console.error(err)
        setToast({ message: `Failed to add subscription: ${err?.message || err}`, type: 'error' })
      }
    })
  }

  const handleDelete = async (id: string, subName: string) => {
    if (confirm(`Are you sure you want to delete subscription "${subName}"?`)) {
      startTransition(async () => {
        try {
          setSubscriptions(prev => prev.filter(sub => sub.id !== id))
          await deleteSubscription(id)
          setToast({ message: `Deleted ${subName}`, type: 'success' })
        } catch (err: any) {
          console.error(err)
          setToast({ message: `Failed to delete subscription: ${err?.message || err}`, type: 'error' })
        }
      })
    }
  }

  const handlePay = async (sub: Subscription) => {
    if (loadingId) return
    setLoadingId(sub.id)

    try {
      await paySubscription(sub.id)
      
      setToast({
        message: `Pembayaran ${sub.name} senilai Rp ${sub.amount.toLocaleString('id-ID')} via ${sub.wallet_name} berhasil dicatat!`,
        type: 'success'
      })
    } catch (err: any) {
      console.error(err)
      setToast({
        message: `Failed to pay subscription: ${err?.message || err}`,
        type: 'error'
      })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
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

      {/* Subscription Summary Dashboard Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[rgb(var(--color-primary))]/5 dark:bg-[rgb(var(--color-primary))]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="mb-4">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Recurring Monthly Spend</span>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white mt-1">
              Rp {totalMonthly.toLocaleString('id-ID')}
            </h2>
          </div>
          <p className="text-xs text-neutral-500">
            For {subscriptions.length} active subscription{subscriptions.length === 1 ? '' : 's'}.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/5 relative overflow-hidden flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Guard Status</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">Active Protection</span>
            </div>
          </div>
          <p className="text-xs text-neutral-550 dark:text-neutral-450 leading-relaxed">
            Auto-checking next due dates and reminding you 5 days beforehand to prevent missed payments.
          </p>
        </div>
      </div>

      {/* Header action / Add button */}
      <div className="flex justify-between items-center mt-2">
        <h3 className="text-xs font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">Recurring Bills</h3>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-250 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Bill</span>
        </motion.button>
      </div>

      {/* Form Container */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 shadow-sm"
          >
            <form onSubmit={handleAddSubscription} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Subscription Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Netflix, Spotify, iCloud"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Amount (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 150000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 outline-none w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Billing Day of Month (1-31)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    placeholder="e.g. 15"
                    value={billingDay}
                    onChange={(e) => setBillingDay(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 outline-none w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Pay via Wallet</label>
                  <AnimatedSelect
                    value={walletName}
                    onChange={(val) => setWalletName(val)}
                    options={cleanWalletOptions}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-900 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Save Bill</span>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscriptions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {subscriptions.map(sub => {
            const daysLeft = getDaysRemaining(sub.billing_day)
            const isDueSoon = daysLeft <= 5

            return (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`p-5 rounded-2xl border ${
                  isDueSoon
                    ? 'border-rose-500/20 bg-rose-500/[0.02] dark:bg-rose-950/[0.02]'
                    : 'border-neutral-200 dark:border-neutral-900 bg-neutral-50/20 dark:bg-neutral-900/5'
                } relative overflow-hidden flex flex-col justify-between gap-4`}
              >
                {/* Header title & delete */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      {sub.name}
                    </h4>
                    <p className="text-[10px] text-neutral-450 dark:text-neutral-500 mt-1 uppercase font-semibold flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-neutral-400" />
                      <span>Via {sub.wallet_name}</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(sub.id, sub.name)}
                    className="text-neutral-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-500/5 cursor-pointer shrink-0"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.5px]" />
                  </button>
                </div>

                {/* Amount and Schedule details */}
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Amount</span>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                      Rp {sub.amount.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Billing Day</span>
                    <p className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 mt-0.5 flex items-center gap-1 justify-end">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Tanggal {sub.billing_day}</span>
                    </p>
                  </div>
                </div>

                {/* Days remaining badge & Mark as paid button */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-900/60 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5">
                    {isDueSoon ? (
                      <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-450 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{daysLeft === 0 ? 'Due Today' : `${daysLeft} days left`}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold px-2 py-0.5 rounded-full">
                        {daysLeft} days left
                      </span>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePay(sub)}
                    disabled={loadingId !== null}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-900 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {loadingId === sub.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <DollarSign className="w-3 h-3" />
                        <span>Bayar Sekarang</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {subscriptions.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-250 dark:border-neutral-800 flex flex-col items-center justify-center gap-3">
          <CreditCard className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
          <div>
            <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No recurring bills</h4>
            <p className="text-xs text-neutral-550 dark:text-neutral-505 mt-1 max-w-xs">
              Add your Netflix, Spotify, or internet bills here to automatically log transactions and monitor due dates.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
