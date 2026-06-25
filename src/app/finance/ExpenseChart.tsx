'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  created_at: string
  category?: string
}

interface ExpenseChartProps {
  transactions: Transaction[]
  selectedMonthStr: string
}

const CATEGORY_COLORS: Record<string, string> = {
  'F&B / Nongkrong': '#f59e0b', // Amber
  'Transport / Bensin': '#3b82f6', // Blue
  'Belanja / Bulanan': '#10b981', // Emerald
  'Hobi / Hiburan': '#ec4899', // Pink
  'Tabungan / Investasi': '#8b5cf6', // Violet
  'Lainnya': '#6b7280' // Gray
}

export function ExpenseChart({ transactions, selectedMonthStr }: ExpenseChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // Filter selected month expenses
  const monthlyExpenses = transactions.filter((tx) => {
    if (tx.type !== 'expense') return false
    if (tx.description === 'SYSTEM_CALIBRATION') return false
    try {
      return tx.created_at.substring(0, 7) === selectedMonthStr
    } catch {
      return false
    }
  })

  // Group by category
  const categoryTotals: Record<string, number> = {}
  let totalExpense = 0

  monthlyExpenses.forEach((tx) => {
    const cat = tx.category || 'Lainnya'
    const amt = Number(tx.amount)
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt
    totalExpense += amt
  })

  // Format into segments
  const segments = Object.entries(categoryTotals)
    .map(([category, amount]) => {
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0
      return {
        category,
        amount,
        percentage,
        color: CATEGORY_COLORS[category] || '#6b7280'
      }
    })
    .sort((a, b) => b.amount - a.amount)

  // Calculate segment SVG dash arrays and offsets
  // Circumference of r=50 circle is 2 * PI * 50 = 314.159
  const circumference = 314.159

  const chartSegments = segments.map((seg, idx) => {
    const offset = circumference - (seg.percentage / 100) * circumference
    const prevSum = segments.slice(0, idx).reduce((sum, s) => sum + s.percentage, 0)
    const rotation = (prevSum / 100) * 360 - 90
    return {
      ...seg,
      offset,
      rotation
    }
  })

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val)
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-900 rounded-2xl p-6 bg-white dark:bg-neutral-950/20 backdrop-blur-md shadow-sm flex flex-col md:flex-row items-center gap-8">
      {/* Donut Chart SVG */}
      <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
        <svg width="160" height="160" className="transform -rotate-0">
          {/* Base Background Circle */}
          <circle
            cx="80"
            cy="80"
            r="50"
            fill="transparent"
            stroke="var(--color-neutral-100, #262626)"
            className="stroke-neutral-100 dark:stroke-neutral-850"
            strokeWidth="10"
          />

          {chartSegments.map((seg, i) => {
            const isHovered = hoveredCategory === seg.category
            return (
              <motion.circle
                key={seg.category}
                cx="80"
                cy="80"
                r="50"
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? 12 : 10}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: seg.offset }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                style={{
                  transform: `rotate(${seg.rotation}deg)`,
                  transformOrigin: '80px 80px',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredCategory(seg.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                className="transition-all duration-200"
              />
            )
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-[9px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-semibold">
            {hoveredCategory ? hoveredCategory : 'Total Expense'}
          </span>
          <span className="text-sm font-mono font-bold text-neutral-900 dark:text-white mt-0.5 transition-all">
            {hoveredCategory
              ? formatCurrency(categoryTotals[hoveredCategory] || 0)
              : formatCurrency(totalExpense)}
          </span>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="flex-1 w-full flex flex-col gap-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-450 dark:text-neutral-500 mb-1">
          Monthly breakdown
        </h4>
        
        {segments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {segments.map((seg) => (
              <div
                key={seg.category}
                onMouseEnter={() => setHoveredCategory(seg.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                  hoveredCategory === seg.category
                    ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/40'
                    : 'border-transparent hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                    {seg.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <span className="text-xs font-mono font-semibold text-neutral-900 dark:text-white">
                    {formatCurrency(seg.amount)}
                  </span>
                  <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500">
                    {seg.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-450 dark:text-neutral-500 italic py-2">
            No expenses logged this month yet.
          </p>
        )}
      </div>
    </div>
  )
}
