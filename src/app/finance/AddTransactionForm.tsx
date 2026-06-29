'use client'

import { useState } from 'react'
import { createTransaction } from '@/app/actions'
import { Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedSelect } from '@/app/components/ui/AnimatedSelect'

export function AddTransactionForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactionType, setTransactionType] = useState('expense')
  const [walletName, setWalletName] = useState('Cash')
  const [customWalletName, setCustomWalletName] = useState('')
  const [category, setCategory] = useState('Lainnya')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createTransaction(formData)
      setIsOpen(false)
      setTransactionType('expense')
      setWalletName('Cash')
      setCustomWalletName('')
      setCategory('Lainnya')
    } catch (err: any) {
      console.error(err)
      alert(`Failed to log transaction: ${err?.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="add-button"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-900 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-350 dark:hover:border-neutral-800 transition-all text-xs font-semibold bg-neutral-50/50 dark:bg-neutral-900/5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[1.5px]" />
            Add Transaction
          </motion.button>
        ) : (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">Log Transaction</h3>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setTransactionType('expense')
                  setWalletName('Cash')
                  setCustomWalletName('')
                  setCategory('Lainnya')
                }}
                className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5px]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Type</label>
                  <AnimatedSelect
                    name="type"
                    value={transactionType}
                    onChange={(val) => setTransactionType(val)}
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
                    name="amount"
                    step="1"
                    required
                    placeholder="10000"
                    className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 outline-none w-full"
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Category</label>
                <AnimatedSelect
                  value={category}
                  onChange={(val) => setCategory(val)}
                  options={[
                    { value: 'F&B / Nongkrong', label: 'F&B / Nongkrong' },
                    { value: 'Transport / Bensin', label: 'Transport / Bensin' },
                    { value: 'Belanja / Bulanan', label: 'Belanja / Bulanan' },
                    { value: 'Hobi / Hiburan', label: 'Hobi / Hiburan' },
                    { value: 'Tabungan / Investasi', label: 'Tabungan / Investasi' },
                    { value: 'Lainnya', label: 'Lainnya' }
                  ]}
                />
                <input type="hidden" name="category" value={category} />
              </div>

              {/* Wallet Name Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Wallet / Account</label>
                <AnimatedSelect
                  value={walletName}
                  onChange={(val) => setWalletName(val)}
                  options={[
                    { value: 'Cash', label: 'Cash' },
                    { value: 'Gopay', label: 'Gopay' },
                    { value: 'Dana', label: 'Dana' },
                    { value: 'Livin', label: 'Livin' },
                    { value: 'Ovo', label: 'Ovo' },
                    { value: 'Custom', label: 'Custom / Other...' }
                  ]}
                />
                
                {walletName === 'Custom' && (
                  <input
                    type="text"
                    required
                    placeholder="e.g. BCA, cash-drawer"
                    value={customWalletName}
                    onChange={(e) => setCustomWalletName(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 outline-none w-full mt-2 animate-fade-in"
                  />
                )}

                <input type="hidden" name="wallet_name" value={walletName === 'Custom' ? customWalletName : walletName} />
                <input type="hidden" name="wallet_type" value={(walletName === 'Custom' ? customWalletName : walletName) === 'Cash' ? 'Cash' : 'Cashless'} />
              </div>

              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="Description (e.g. Snacks, Textbooks)"
                  className="w-full bg-transparent text-sm text-neutral-800 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 outline-none border-b border-neutral-100 dark:border-neutral-900 focus:border-neutral-300 dark:focus:border-neutral-700 pb-1.5 transition-colors"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? 'Logging...' : 'Log Transaction'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
