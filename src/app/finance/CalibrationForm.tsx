'use client'

import { useState } from 'react'
import { calibrateWallet } from '@/app/actions'
import { Wrench, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedSelect } from '@/app/components/ui/AnimatedSelect'
import { triggerHaptic } from '@/lib/haptic'

export function CalibrationForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [walletName, setWalletName] = useState('Cash')
  const [customWalletName, setCustomWalletName] = useState('')
  const [targetBalance, setTargetBalance] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    triggerHaptic(50)
    setLoading(true)

    const finalWalletName = walletName === 'Custom' ? customWalletName : walletName
    const parsedTarget = parseFloat(targetBalance)

    if (isNaN(parsedTarget)) {
      alert('Please enter a valid target balance')
      setLoading(false)
      return
    }

    try {
      await calibrateWallet(finalWalletName, parsedTarget)
      setIsOpen(false)
      setTargetBalance('')
      setWalletName('Cash')
      setCustomWalletName('')
    } catch (err) {
      console.error(err)
      alert('Failed to calibrate wallet balance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="calib-btn"
            onClick={() => {
              triggerHaptic(20)
              setIsOpen(true)
            }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            whileTap={{ scale: 0.96 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-900 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-350 dark:hover:border-neutral-800 transition-all text-xs font-semibold bg-neutral-50/50 dark:bg-neutral-900/5 cursor-pointer mt-2"
          >
            <Wrench className="w-4 h-4 stroke-[1.5px]" />
            Kalibrasi Saldo
          </motion.button>
        ) : (
          <motion.div
            key="calib-form"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/20 backdrop-blur-md shadow-sm mt-2"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-neutral-450" />
                Kalibrasi Saldo Wallet
              </h3>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10)
                  setIsOpen(false)
                  setTargetBalance('')
                  setWalletName('Cash')
                  setCustomWalletName('')
                }}
                className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5px]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Wallet Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Pilih Wallet</label>
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
                    placeholder="e.g. BCA, ShopeePay"
                    value={customWalletName}
                    onChange={(e) => setCustomWalletName(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 outline-none w-full mt-2 animate-fade-in"
                  />
                )}
              </div>

              {/* Target Balance */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Saldo Target (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="50000"
                  step="1"
                  value={targetBalance}
                  onChange={(e) => setTargetBalance(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 outline-none w-full"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? 'Calibrating...' : 'Calibrate Balance'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
