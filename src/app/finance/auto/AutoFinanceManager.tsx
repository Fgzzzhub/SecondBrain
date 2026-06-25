'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Calendar, Wallet, CheckCircle, AlertTriangle, Loader2, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'
import { createAutoTransaction, deleteAutoTransaction } from '@/app/actions'
import { AnimatedSelect } from '@/app/components/ui/AnimatedSelect'

interface AutoRule {
  id: string
  title: string
  type: 'income' | 'expense'
  amount: number
  category: string
  wallet_name: string
  frequency: 'daily' | 'monthly'
  billing_day: number | null
  last_processed_at: string | null
  created_at: string
}

interface AutoFinanceManagerProps {
  initialRules: AutoRule[]
}

const cleanWalletOptions = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Gopay', label: 'Gopay' },
  { value: 'Dana', label: 'Dana' },
  { value: 'Livin', label: 'Livin' },
  { value: 'Ovo', label: 'Ovo' },
  { value: 'Custom', label: 'Custom / Other...' }
]

const categoryOptions = [
  { value: 'F&B / Nongkrong', label: 'F&B / Nongkrong' },
  { value: 'Transport / Bensin', label: 'Transport / Bensin' },
  { value: 'Belanja / Bulanan', label: 'Belanja / Bulanan' },
  { value: 'Hobi / Hiburan', label: 'Hobi / Hiburan' },
  { value: 'Tabungan / Investasi', label: 'Tabungan / Investasi' },
  { value: 'Lainnya', label: 'Lainnya' }
]

export function AutoFinanceManager({ initialRules }: AutoFinanceManagerProps) {
  const [rules, setRules] = useState<AutoRule[]>(initialRules)
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Lainnya')
  const [walletName, setWalletName] = useState('Cash')
  const [customWalletName, setCustomWalletName] = useState('')
  
  // UI helper for custom frequencies
  const [uiFrequency, setUiFrequency] = useState<'daily' | 'interval' | 'monthly'>('daily')
  const [intervalDays, setIntervalDays] = useState('3')
  const [billingDay, setBillingDay] = useState('')

  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setRules(initialRules)
  }, [initialRules])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount) return

    const actualWallet = walletName === 'Custom' ? customWalletName : walletName
    if (walletName === 'Custom' && !customWalletName) {
      setToast({ message: 'Please specify custom wallet name', type: 'error' })
      return
    }

    let dayNum: number | null = null
    let actualFreq: 'daily' | 'monthly' = 'daily'

    if (uiFrequency === 'daily') {
      actualFreq = 'daily'
      dayNum = 1
    } else if (uiFrequency === 'interval') {
      actualFreq = 'daily'
      if (!intervalDays) {
        setToast({ message: 'Please specify interval in days', type: 'error' })
        return
      }
      dayNum = parseInt(intervalDays)
      if (dayNum < 1) {
        setToast({ message: 'Interval must be at least 1 day', type: 'error' })
        return
      }
    } else if (uiFrequency === 'monthly') {
      actualFreq = 'monthly'
      if (!billingDay) {
        setToast({ message: 'Billing day is required for monthly frequency', type: 'error' })
        return
      }
      dayNum = parseInt(billingDay)
      if (dayNum < 1 || dayNum > 31) {
        setToast({ message: 'Billing day must be between 1 and 31', type: 'error' })
        return
      }
    }

    const amtNum = parseFloat(amount)

    startTransition(async () => {
      try {
        const tempId = Math.random().toString()
        const newRule: AutoRule = {
          id: tempId,
          title,
          type,
          amount: amtNum,
          category,
          wallet_name: actualWallet,
          frequency: actualFreq,
          billing_day: dayNum,
          last_processed_at: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }

        // Optimistic UI update
        setRules(prev => [newRule, ...prev])
        setIsAdding(false)
        
        // Reset fields
        setTitle('')
        setAmount('')
        setBillingDay('')
        setIntervalDays('3')
        setCustomWalletName('')
        setWalletName('Cash')
        setCategory('Lainnya')
        setUiFrequency('daily')

        await createAutoTransaction(title, type, amtNum, category, actualWallet, actualFreq, dayNum)
        setToast({ message: `Successfully created automated rule: ${title}`, type: 'success' })
      } catch (err: any) {
        console.error(err)
        setToast({ message: `Failed to create rule: ${err?.message || err}`, type: 'error' })
      }
    })
  }

  const handleDelete = async (id: string, ruleTitle: string) => {
    if (confirm(`Are you sure you want to delete automated rule "${ruleTitle}"?`)) {
      startTransition(async () => {
        try {
          setRules(prev => prev.filter(r => r.id !== id))
          await deleteAutoTransaction(id)
          setToast({ message: `Deleted automated rule: ${ruleTitle}`, type: 'success' })
        } catch (err: any) {
          console.error(err)
          setToast({ message: `Failed to delete rule: ${err?.message || err}`, type: 'error' })
        }
      })
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

      {/* Rules Count Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Daily / Custom Interval Rules</span>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white mt-1">
              {rules.filter(r => r.frequency === 'daily').length} Active
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-4">
            Runs automatically based on daily intervals (e.g., every day, every 3 days, or weekly).
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Monthly Income/Expense Rules</span>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white mt-1">
              {rules.filter(r => r.frequency === 'monthly').length} Active
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-4">
            Runs monthly on designated billing days for salaries or fixed subscriptions.
          </p>
        </div>
      </div>

      {/* Add rule action button */}
      <div className="flex justify-between items-center mt-2">
        <h3 className="text-xs font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">Automation rules</h3>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-250 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Rule</span>
        </motion.button>
      </div>

      {/* Add Rule Form Container */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 backdrop-blur-md shadow-sm"
          >
            <form onSubmit={handleAddRule} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uang Makan Harian, Uang Jajan 3 Hari, Gaji Bulanan"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 outline-none w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Type</label>
                    <AnimatedSelect
                      value={type}
                      onChange={(val) => setType(val as 'income' | 'expense')}
                      options={[
                        { value: 'expense', label: 'Expense' },
                        { value: 'income', label: 'Income' }
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Amount (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Category</label>
                  <AnimatedSelect
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={categoryOptions}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Wallet / Account</label>
                  <AnimatedSelect
                    value={walletName}
                    onChange={(val) => setWalletName(val)}
                    options={cleanWalletOptions}
                  />
                  {walletName === 'Custom' && (
                    <input
                      type="text"
                      required
                      placeholder="Custom wallet name"
                      value={customWalletName}
                      onChange={(e) => setCustomWalletName(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 outline-none w-full mt-2 animate-fade-in"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Frequency Mode</label>
                  <AnimatedSelect
                    value={uiFrequency}
                    onChange={(val) => setUiFrequency(val as 'daily' | 'interval' | 'monthly')}
                    options={[
                      { value: 'daily', label: 'Every Day (Daily)' },
                      { value: 'interval', label: 'Interval (Every X Days)' },
                      { value: 'monthly', label: 'Monthly' }
                    ]}
                  />
                </div>

                {uiFrequency === 'interval' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Interval in Days (e.g. 7 for weekly)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 3"
                      value={intervalDays}
                      onChange={(e) => setIntervalDays(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 outline-none w-full"
                    />
                  </div>
                )}

                {uiFrequency === 'monthly' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Billing Day of Month (1-31)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="31"
                      placeholder="e.g. 25"
                      value={billingDay}
                      onChange={(e) => setBillingDay(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 outline-none w-full"
                    />
                  </div>
                )}
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
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Save Rule</span>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {rules.map(rule => {
            const isIncome = rule.type === 'income'

            return (
              <motion.div
                key={rule.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-neutral-50/20 dark:bg-neutral-900/5 relative overflow-hidden flex flex-col justify-between gap-4"
              >
                {/* Header title & delete */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      {rule.title}
                    </h4>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 font-mono uppercase tracking-wider ${
                      isIncome 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      <span>{rule.type}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(rule.id, rule.title)}
                    className="text-neutral-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-500/5 cursor-pointer shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.5px]" />
                  </button>
                </div>

                {/* Amount, Category, Wallet details */}
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Amount</span>
                    <p className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                      Rp {rule.amount.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Account / Category</span>
                    <p className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 mt-0.5 flex items-center gap-1 justify-end">
                      <Wallet className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{rule.wallet_name} &bull; {rule.category}</span>
                    </p>
                  </div>
                </div>

                {/* Footer status / last processed */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-neutral-400 animate-spin-slow" />
                    <span>
                      Frequency:{' '}
                      <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {rule.frequency === 'daily'
                          ? rule.billing_day && rule.billing_day > 1
                            ? `Every ${rule.billing_day} Days`
                            : 'Daily'
                          : `Monthly (Day ${rule.billing_day})`}
                      </strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span>Last run: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{rule.last_processed_at || 'Never'}</strong></span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {rules.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-neutral-250 dark:border-neutral-800 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
          <div>
            <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No automated rules</h4>
            <p className="text-xs text-neutral-550 dark:text-neutral-505 mt-1 max-w-xs">
              Configure daily allowances or monthly salaries to automatically record transaction logs.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
