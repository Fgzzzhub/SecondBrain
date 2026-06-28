'use client'

import { useState } from 'react'
import { confirmPendingTransaction, deleteTransaction } from '@/app/actions'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Trash2, Edit2, AlertCircle, Sparkles } from 'lucide-react'
import { AnimatedSelect } from '@/app/components/ui/AnimatedSelect'
import { triggerHaptic } from '@/lib/haptic'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  created_at: string
  wallet_type?: 'Cash' | 'Cashless'
  wallet_name?: string
  category?: string
  raw_subject?: string
  confidence?: number
  source?: string
}

interface PendingTransactionsProps {
  transactions: Transaction[]
}

const CATEGORIES = [
  { value: 'F&B / Nongkrong', label: 'F&B / Nongkrong' },
  { value: 'Transport / Bensin', label: 'Transport / Bensin' },
  { value: 'Belanja / Bulanan', label: 'Belanja / Bulanan' },
  { value: 'Hobi / Hiburan', label: 'Hobi / Hiburan' },
  { value: 'Tabungan / Investasi', label: 'Tabungan / Investasi' },
  { value: 'Lainnya', label: 'Lainnya' }
]

const WALLETS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Gopay', label: 'Gopay' },
  { value: 'Dana', label: 'Dana' },
  { value: 'Livin', label: 'Livin' },
  { value: 'Ovo', label: 'Ovo' },
  { value: 'BCA', label: 'BCA' }
]

export function PendingTransactions({ transactions: initialTransactions }: PendingTransactionsProps) {
  const [items, setItems] = useState<Transaction[]>(initialTransactions)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Local state for editing form fields
  const [editFields, setEditFields] = useState<{
    amount: number
    type: 'income' | 'expense'
    description: string
    category: string
    wallet_name: string
  } | null>(null)

  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (items.length === 0) return null

  const handleStartEdit = (tx: Transaction) => {
    triggerHaptic(10)
    setEditingId(tx.id)
    setEditFields({
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      category: tx.category || 'Lainnya',
      wallet_name: tx.wallet_name || 'Cashless'
    })
  }

  const handleConfirm = async (tx: Transaction) => {
    triggerHaptic(15)
    setLoadingId(tx.id)

    const payload = editingId === tx.id && editFields
      ? editFields
      : {
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          category: tx.category || 'Lainnya',
          wallet_name: tx.wallet_name || 'Cashless'
        }

    try {
      await confirmPendingTransaction(
        tx.id,
        payload.amount,
        payload.type,
        payload.description,
        payload.category,
        payload.wallet_name
      )
      setItems(prev => prev.filter(item => item.id !== tx.id))
      setEditingId(null)
      setEditFields(null)
    } catch (err: any) {
      console.error(err)
      alert(`Gagal konfirmasi transaksi: ${err?.message || err}`)
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    triggerHaptic(20)
    if (!confirm('Hapus transaksi otomatis ini?')) return
    setLoadingId(id)
    try {
      await deleteTransaction(id)
      setItems(prev => prev.filter(item => item.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setEditFields(null)
      }
    } catch (err: any) {
      console.error(err)
      alert(`Gagal menghapus transaksi: ${err?.message || err}`)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 bg-amber-500/5 dark:bg-amber-500/3 border border-amber-500/10 dark:border-amber-500/5 p-4 rounded-2xl mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 stroke-[2px]" />
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Perlu Review ({items.length})
          </h2>
        </div>
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
          Transaksi otomatis dari email bank/e-wallet
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {items.map(tx => {
            const isEditing = editingId === tx.id
            const isLoading = loadingId === tx.id
            const confidenceColor = (tx.confidence ?? 100) >= 80
              ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
              : 'text-amber-500 bg-amber-500/10 border-amber-500/20'

            return (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 p-4 rounded-xl flex flex-col gap-3"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    {tx.raw_subject && (
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate max-w-[240px]">
                        Subject: "{tx.raw_subject}"
                      </span>
                    )}
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                      Sumber: {tx.source || 'Email'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${confidenceColor} flex-shrink-0`}>
                    {tx.confidence ?? 0}% confidence
                  </span>
                </div>

                {isEditing && editFields ? (
                  // EDITING INTERFACE
                  <div className="flex flex-col gap-3 mt-1">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Type Toggle */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Tipe</label>
                        <div className="grid grid-cols-2 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                          <button
                            type="button"
                            onClick={() => setEditFields(prev => prev ? { ...prev, type: 'expense' } : null)}
                            className={`py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                              editFields.type === 'expense'
                                ? 'bg-red-500 text-white'
                                : 'text-neutral-500 dark:text-neutral-400'
                            }`}
                          >
                            Pengel.
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditFields(prev => prev ? { ...prev, type: 'income' } : null)}
                            className={`py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                              editFields.type === 'income'
                                ? 'bg-emerald-500 text-white'
                                : 'text-neutral-500 dark:text-neutral-400'
                            }`}
                          >
                            Pemas.
                          </button>
                        </div>
                      </div>

                      {/* Amount Field */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Nominal (Rp)</label>
                        <input
                          type="number"
                          value={editFields.amount}
                          onChange={(e) => setEditFields(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                          className="bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-1.5 outline-none w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Category Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Kategori</label>
                        <AnimatedSelect
                          value={editFields.category}
                          onChange={(val) => setEditFields(prev => prev ? { ...prev, category: val } : null)}
                          options={CATEGORIES}
                        />
                      </div>

                      {/* Wallet Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Dompet</label>
                        <AnimatedSelect
                          value={editFields.wallet_name}
                          onChange={(val) => setEditFields(prev => prev ? { ...prev, wallet_name: val } : null)}
                          options={WALLETS}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">Keterangan</label>
                      <input
                        type="text"
                        value={editFields.description}
                        onChange={(e) => setEditFields(prev => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Keterangan transaksi"
                        className="bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 outline-none w-full"
                      />
                    </div>
                  </div>
                ) : (
                  // STATIC SHOWCASE
                  <div className="flex items-center justify-between mt-1">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-white truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                          {tx.category || 'Lainnya'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                          {tx.wallet_name || 'Cashless'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-base font-bold font-mono ${tx.type === 'income' ? 'text-emerald-500' : 'text-neutral-800 dark:text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'}Rp{tx.amount.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[9px] text-neutral-400 mt-0.5">
                        {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions row */}
                <div className="flex items-center justify-end gap-2 mt-1 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(tx)}
                      disabled={isLoading}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-850 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => { setEditingId(null); setEditFields(null) }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(tx.id)}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 text-red-500 hover:bg-red-500/10 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                  <button
                    onClick={() => handleConfirm(tx)}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isEditing ? 'Simpan & Setuju' : 'Konfirmasi'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
