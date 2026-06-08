'use client'

import { motion } from 'framer-motion'
import { Sparkles, Terminal } from 'lucide-react'

interface DailyBriefingProps {
  tasksCompleted: number
  todayExpenses: number
  cigarettesSmoked: number
}

export function DailyBriefing({ tasksCompleted, todayExpenses, cigarettesSmoked }: DailyBriefingProps) {
  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val)
  }

  const expensesStr = formatCurrency(todayExpenses)

  // Dynamic Logic Engine
  let briefing = ''
  let rating = '5/10'
  let vibe = 'Neutral'

  if (tasksCompleted > 2 && todayExpenses < 50000 && cigarettesSmoked === 0) {
    briefing = `Highly productive today! You saved money, completed ${tasksCompleted} tasks, and kept it clean with 0 cigarettes. Solid 9/10.`
    rating = '9/10'
    vibe = 'Zen Master'
  } else if (tasksCompleted > 2 && todayExpenses < 50000) {
    briefing = `Highly productive today. You saved money, completed ${tasksCompleted} tasks, and smoked ${cigarettesSmoked} sticks. Solid 8/10.`
    rating = '8/10'
    vibe = 'Productive but Smokin'
  } else if (tasksCompleted === 0 && todayExpenses > 100000 && cigarettesSmoked > 5) {
    briefing = `Zero tasks done, burned through ${expensesStr}, and smoked ${cigarettesSmoked} sticks. Let's try harder tomorrow.`
    rating = '2/10'
    vibe = 'Downwards Spiral'
  } else if (tasksCompleted === 0 && todayExpenses > 100000) {
    briefing = `Zero tasks completed and you spent ${expensesStr}. Your wallet is crying and your to-do list is laughing.`
    rating = '3/10'
    vibe = 'Expensive Sloth'
  } else if (tasksCompleted === 0 && todayExpenses === 0 && cigarettesSmoked === 0) {
    briefing = `No tasks done today, but you spent Rp 0 and smoked 0 cigarettes. Financial and physical health: 100. Productivity: 0.`
    rating = '6/10'
    vibe = 'Inertia'
  } else if (cigarettesSmoked > 8 && tasksCompleted === 0) {
    briefing = `You smoked ${cigarettesSmoked} sticks and completed 0 tasks today. You're basically a chimney that's procrastinating.`
    rating = '2/10'
    vibe = 'Heavy Fog'
  } else if (tasksCompleted > 0 && todayExpenses === 0 && cigarettesSmoked === 0) {
    briefing = `Productive and clean: completed ${tasksCompleted} tasks, spent Rp 0, and smoked 0 cigarettes. Absolute legend behavior.`
    rating = '10/10'
    vibe = 'Giga Chad'
  } else {
    // Fallback/Moderate
    briefing = `Today's report: completed ${tasksCompleted} tasks, spent ${expensesStr}, and smoked ${cigarettesSmoked} sticks. A fairly average day in the matrix.`
    rating = '6/10'
    vibe = 'Balanced'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="w-full border border-neutral-200 dark:border-neutral-900 rounded-2xl p-5 bg-white dark:bg-neutral-950/20 backdrop-blur-md shadow-sm relative overflow-hidden"
    >
      {/* Subtle background vibe light */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[rgb(var(--color-primary))]/5 dark:bg-[rgb(var(--color-primary))]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shrink-0">
          <Terminal className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-neutral-850 dark:text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Daily Briefing
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                {vibe}
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded-full font-mono">
                {rating}
              </span>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm text-neutral-650 dark:text-neutral-300 leading-relaxed font-normal">
            {briefing}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
