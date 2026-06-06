'use client'

import { useState } from 'react'
import { deleteTransaction } from '@/app/actions'
import { Trash2, ArrowDownLeft, ArrowUpRight, ChevronDown } from 'lucide-react'
import { groupByDate } from '@/lib/dateUtils'
import { format } from 'date-fns'
import { triggerHaptic } from '@/lib/haptic'
import { motion, AnimatePresence } from 'framer-motion'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  created_at: string
  wallet_type?: 'Cash' | 'Cashless'
  wallet_name?: string
}

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  // Store expanded dates in a Set. By default, it is empty (all date groups collapsed)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  const handleDelete = async (id: string, desc: string) => {
    triggerHaptic(40)
    if (confirm(`Delete transaction: "${desc}"?`)) {
      triggerHaptic(80)
      await deleteTransaction(id)
    }
  }

  const toggleDate = (dateStr: string) => {
    triggerHaptic(10)
    setExpandedDates((prev) => {
      const next = new Set(prev)
      if (next.has(dateStr)) {
        next.delete(dateStr)
      } else {
        next.add(dateStr)
      }
      return next
    })
  }

  // Group transactions by date
  const groupedTransactions = groupByDate(transactions, (tx) => tx.created_at)

  return (
    <div className="border border-neutral-900 rounded-2xl overflow-hidden bg-neutral-900/10">
      {transactions.length > 0 ? (
        <div className="flex flex-col max-h-[550px] overflow-y-auto scrollbar-thin divide-y divide-neutral-900">
          {Object.entries(groupedTransactions).map(([dateStr, group]) => {
            const isExpanded = expandedDates.has(dateStr)
            
            // Calculate Daily Net Total
            const netTotal = group.reduce((sum, tx) => {
              const val = Number(tx.amount)
              return tx.type === 'income' ? sum + val : sum - val
            }, 0)

            const formattedNet = new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0
            }).format(Math.abs(netTotal))

            return (
              <div key={dateStr} className="flex flex-col">
                {/* Interactive Softer Date Header */}
                <button
                  onClick={() => toggleDate(dateStr)}
                  className="w-full flex items-center justify-between py-3 px-4 bg-neutral-900/30 hover:bg-neutral-850/40 active:bg-neutral-850/60 transition-colors text-left cursor-pointer border-b border-neutral-900/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-450 transition-transform duration-300 shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                    <span className="text-sm font-medium text-neutral-355 capitalize truncate">
                      {format(new Date(dateStr), 'eeee, d MMMM yyyy')}
                    </span>
                  </div>

                  <span className={`text-xs font-mono font-semibold shrink-0 ${
                    netTotal > 0 ? 'text-emerald-400' : netTotal < 0 ? 'text-red-400' : 'text-neutral-500'
                  }`}>
                    {netTotal > 0 ? '+' : netTotal < 0 ? '-' : ''}{formattedNet}
                  </span>
                </button>

                {/* Collapsible Rows Container with Framer Motion */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', duration: 0.4, bounce: 0.08 }}
                      className="overflow-hidden"
                    >
                      <motion.div 
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.03
                            }
                          }
                        }}
                        initial="hidden"
                        animate="visible"
                        className="divide-y divide-neutral-900/40 bg-neutral-950/10"
                      >
                        <AnimatePresence mode="popLayout">
                          {group.map((tx) => (
                            <motion.div 
                              key={tx.id} 
                              layout
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 }
                              }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                              className="py-3 px-4 flex items-center justify-between hover:bg-neutral-900/10 transition-colors gap-4"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Type Badge */}
                                <div className={`p-1.5 rounded-full shrink-0 ${
                                  tx.type === 'income' 
                                    ? 'text-green-400 bg-green-950/20' 
                                    : 'text-red-400 bg-red-950/20'
                                }`}>
                                  {tx.type === 'income' ? (
                                    <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2px]" />
                                  ) : (
                                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2px]" />
                                  )}
                                </div>

                                {/* Description & Wallet Badge */}
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs sm:text-sm font-medium text-neutral-200 truncate">
                                    {tx.description}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-450 border border-neutral-850 font-mono">
                                      {tx.wallet_name || tx.wallet_type || 'Cashless'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                <span className={`text-xs sm:text-sm font-mono font-semibold ${
                                  tx.type === 'income' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {tx.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(tx.amount))}
                                </span>

                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  onClick={() => handleDelete(tx.id, tx.description)}
                                  className="text-neutral-600 hover:text-red-450 p-1.5 rounded transition-colors cursor-pointer"
                                  title="Delete transaction"
                                >
                                  <Trash2 className="w-3.5 h-3.5 stroke-[1.5px]" />
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-xs text-neutral-550">No transactions recorded for this month.</p>
        </div>
      )}
    </div>
  )
}
