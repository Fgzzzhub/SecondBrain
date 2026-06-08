'use client'

import { motion } from 'framer-motion'
import { Cigarette, Coffee, AlertCircle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

interface CigaretteLog {
  smoked_at: string
  log_type?: 'self' | 'shared'
}

interface Transaction {
  amount: number
  created_at: string
  category?: string
  type: 'income' | 'expense'
}

interface HabitCorrelationProps {
  cigaretteLogs: CigaretteLog[]
  transactions: Transaction[]
}

export function HabitCorrelation({ cigaretteLogs, transactions }: HabitCorrelationProps) {
  // Generate list of last 30 days
  const today = new Date()
  const dates30Days: string[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    dates30Days.push(d.toISOString().split('T')[0])
  }

  // Group cigarettes (only 'self' type logs count towards personal habits)
  const cigsByDate: Record<string, number> = {}
  dates30Days.forEach((dateStr) => {
    cigsByDate[dateStr] = 0
  })

  cigaretteLogs.forEach((log) => {
    if (log.log_type === 'shared') return
    try {
      const dateStr = log.smoked_at.substring(0, 10)
      if (cigsByDate[dateStr] !== undefined) {
        cigsByDate[dateStr] += 1
      }
    } catch {}
  })

  // Group F&B spending
  const spendingByDate: Record<string, number> = {}
  dates30Days.forEach((dateStr) => {
    spendingByDate[dateStr] = 0
  })

  transactions.forEach((tx) => {
    if (tx.type !== 'expense' || tx.category !== 'F&B / Nongkrong') return
    try {
      const dateStr = tx.created_at.substring(0, 10)
      if (spendingByDate[dateStr] !== undefined) {
        spendingByDate[dateStr] += Number(tx.amount)
      }
    } catch {}
  })

  // Split into Hangout (spend > 0) vs Stay-in (spend == 0) days
  const hangoutDays = dates30Days.filter((d) => spendingByDate[d] > 0)
  const stayInDays = dates30Days.filter((d) => spendingByDate[d] === 0)

  const hangoutCigsTotal = hangoutDays.reduce((sum, d) => sum + cigsByDate[d], 0)
  const stayInCigsTotal = stayInDays.reduce((sum, d) => sum + cigsByDate[d], 0)

  const hangoutAvg = hangoutDays.length > 0 ? hangoutCigsTotal / hangoutDays.length : 0
  const stayInAvg = stayInDays.length > 0 ? stayInCigsTotal / stayInDays.length : 0

  // Calculate percentage difference
  let pctDiff = 0
  let trend: 'higher' | 'lower' | 'equal' = 'equal'

  if (stayInAvg > 0 && hangoutAvg !== stayInAvg) {
    pctDiff = Math.abs(((hangoutAvg - stayInAvg) / stayInAvg) * 100)
    trend = hangoutAvg > stayInAvg ? 'higher' : 'lower'
  } else if (stayInAvg === 0 && hangoutAvg > 0) {
    pctDiff = 100
    trend = 'higher'
  }

  const maxAvg = Math.max(hangoutAvg, stayInAvg, 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="w-full border border-neutral-200 dark:border-neutral-900 rounded-2xl p-6 bg-white dark:bg-neutral-950/20 backdrop-blur-md shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
          <Cigarette className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-850 dark:text-neutral-200">
            Vices & Vibes Correlation
          </h3>
          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 uppercase tracking-wider font-medium">
            Personal Habits vs. Social Expenses (Last 30 Days)
          </p>
        </div>
      </div>

      {/* Primary Narrative Insight */}
      <div className="bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-100 dark:border-neutral-900/50 rounded-xl p-4 mb-6">
        <p className="text-xs sm:text-sm text-neutral-650 dark:text-neutral-300 leading-relaxed">
          On days you hang out (F&B spent), you smoke an average of{' '}
          <strong className="text-amber-500 dark:text-amber-450 font-mono text-sm sm:text-base">
            {hangoutAvg.toFixed(1)}
          </strong>{' '}
          sticks. On days you stay in, you smoke{' '}
          <strong className="text-neutral-800 dark:text-white font-mono text-sm sm:text-base">
            {stayInAvg.toFixed(1)}
          </strong>{' '}
          sticks.
        </p>

        {trend !== 'equal' && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-neutral-200/50 dark:border-neutral-900/40">
            {trend === 'higher' ? (
              <ArrowUpRight className="w-4 h-4 text-red-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-emerald-500" />
            )}
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Your personal cigarette intake is{' '}
              <strong className={trend === 'higher' ? 'text-red-400' : 'text-emerald-400'}>
                {pctDiff.toFixed(0)}% {trend === 'higher' ? 'higher' : 'lower'}
              </strong>{' '}
              on social hangout days.
            </span>
          </div>
        )}
      </div>

      {/* Visual Bars Breakdown */}
      <div className="flex flex-col gap-4">
        {/* Hangout Days */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-neutral-550 dark:text-neutral-450">
              <Coffee className="w-3.5 h-3.5" />
              <span>Hangout Days ({hangoutDays.length} days)</span>
            </div>
            <span className="font-mono font-bold text-neutral-900 dark:text-white">
              {hangoutAvg.toFixed(1)} stick/day
            </span>
          </div>
          <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(hangoutAvg / maxAvg) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-amber-500 rounded-full"
            />
          </div>
        </div>

        {/* Stay-in Days */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-neutral-550 dark:text-neutral-450">
              <Minus className="w-3.5 h-3.5" />
              <span>Stay-in Days ({stayInDays.length} days)</span>
            </div>
            <span className="font-mono font-bold text-neutral-900 dark:text-white">
              {stayInAvg.toFixed(1)} stick/day
            </span>
          </div>
          <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stayInAvg / maxAvg) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-neutral-400 dark:bg-neutral-600 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Data Source Notice */}
      <div className="flex items-center gap-1.5 mt-5 text-[9px] text-neutral-400 dark:text-neutral-500 font-medium">
        <AlertCircle className="w-3 h-3 shrink-0" />
        <span>Correlating cigarette intake against transactions in &quot;F&B / Nongkrong&quot;</span>
      </div>
    </motion.div>
  )
}
