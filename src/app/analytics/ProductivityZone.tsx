'use client'

import { motion } from 'framer-motion'
import { Zap, Sun, CloudSun, Moon, Compass, AlertCircle } from 'lucide-react'

interface CompletedTask {
  id: string
  completed_at: string | null
  title: string
}

interface ProductivityZoneProps {
  completedTasks: CompletedTask[]
}

type TimeBlockKey = 'Morning' | 'Afternoon' | 'Night' | 'Late Night'

interface TimeBlockInfo {
  label: string
  hours: string
  icon: typeof Sun
  colorClass: string
  barColor: string
}

const TIME_BLOCK_META: Record<TimeBlockKey, TimeBlockInfo> = {
  'Morning': {
    label: 'Morning',
    hours: '06:00 - 12:00',
    icon: Sun,
    colorClass: 'text-amber-500 bg-amber-500/10',
    barColor: 'bg-amber-500'
  },
  'Afternoon': {
    label: 'Afternoon',
    hours: '12:00 - 18:00',
    icon: CloudSun,
    colorClass: 'text-orange-500 bg-orange-500/10',
    barColor: 'bg-orange-500'
  },
  'Night': {
    label: 'Night',
    hours: '18:00 - 00:00',
    icon: Moon,
    colorClass: 'text-indigo-400 bg-indigo-400/10',
    barColor: 'bg-indigo-400'
  },
  'Late Night': {
    label: 'Late Night',
    hours: '00:00 - 06:00',
    icon: Compass,
    colorClass: 'text-purple-400 bg-purple-400/10',
    barColor: 'bg-purple-400'
  }
}

export function ProductivityZone({ completedTasks }: ProductivityZoneProps) {
  // Filters out tasks without completed_at timestamp
  const validTasks = completedTasks.filter((t) => t.completed_at !== null)
  const totalCount = validTasks.length

  // Initialize block counters
  const counts: Record<TimeBlockKey, number> = {
    'Morning': 0,
    'Afternoon': 0,
    'Night': 0,
    'Late Night': 0
  }

  // Group task completions by hour
  validTasks.forEach((task) => {
    try {
      const hour = new Date(task.completed_at!).getHours()
      if (hour >= 6 && hour < 12) {
        counts['Morning'] += 1
      } else if (hour >= 12 && hour < 18) {
        counts['Afternoon'] += 1
      } else if (hour >= 18 && hour < 24) {
        counts['Night'] += 1
      } else {
        counts['Late Night'] += 1
      }
    } catch {}
  })

  // Find peak block
  let peakBlock: TimeBlockKey = 'Morning'
  let maxCount = -1

  const blocksList = Object.keys(counts) as TimeBlockKey[]
  blocksList.forEach((key) => {
    if (counts[key] > maxCount) {
      maxCount = counts[key]
      peakBlock = key
    }
  })

  // Calculate percentages
  const percentages = blocksList.reduce((acc, key) => {
    acc[key] = totalCount > 0 ? (counts[key] / totalCount) * 100 : 0
    return acc
  }, {} as Record<TimeBlockKey, number>)

  const peakPct = percentages[peakBlock]
  const PeakIcon = TIME_BLOCK_META[peakBlock].icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
      className="w-full border border-neutral-200 dark:border-neutral-900 rounded-2xl p-6 bg-white dark:bg-neutral-950/20 backdrop-blur-md shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <Zap className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-850 dark:text-neutral-200">
            Productivity Zones
          </h3>
          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 uppercase tracking-wider font-medium">
            Peak Action Item Completion Hours
          </p>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
          <p className="text-xs text-neutral-450 dark:text-neutral-500">
            No completed tasks found with completion timestamps yet.
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500/80 mt-1">
            Complete tasks in your workspace to populate this visualization.
          </p>
        </div>
      ) : (
        <>
          {/* Narrative Summary card */}
          <div className="bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-100 dark:border-neutral-900/50 rounded-xl p-4 mb-6 flex items-start gap-3.5">
            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${TIME_BLOCK_META[peakBlock].colorClass}`}>
              <PeakIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-neutral-650 dark:text-neutral-300 leading-normal">
                Your peak productivity is{' '}
                <strong className="text-neutral-850 dark:text-white font-semibold">
                  {peakBlock} ({TIME_BLOCK_META[peakBlock].hours})
                </strong>
                .
              </p>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-1">
                You complete <strong className="text-indigo-400 font-semibold">{peakPct.toFixed(0)}%</strong> of your tasks during this block.
              </p>
            </div>
          </div>

          {/* Visual Horizontal Bars */}
          <div className="flex flex-col gap-4">
            {blocksList.map((key) => {
              const meta = TIME_BLOCK_META[key]
              const count = counts[key]
              const pct = percentages[key]
              const Icon = meta.icon

              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="font-medium">{meta.label}</span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-normal">
                        ({meta.hours})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-neutral-900 dark:text-white">
                      {count} {count === 1 ? 'task' : 'tasks'} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full ${meta.barColor} rounded-full`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Data Source Notice */}
          <div className="flex items-center gap-1.5 mt-5 text-[9px] text-neutral-400 dark:text-neutral-500 font-medium">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Analyzing {totalCount} completed task{totalCount === 1 ? '' : 's'} with timestamps</span>
          </div>
        </>
      )}
    </motion.div>
  )
}
