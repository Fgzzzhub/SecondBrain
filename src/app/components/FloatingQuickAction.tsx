'use client'

import { useState, useEffect, useRef, useTransition, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  CreditCard,
  Cigarette,
  CheckSquare,
  Bot,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react'
import { useQuickAction } from './QuickActionProvider'
import { triggerHaptic } from '@/lib/haptic'
import { createTransaction, createTask, smokeOneStick, getActiveCigarettePacks } from '../actions'
import { AIChatDrawer } from './AIChatDrawer'
import { AnimatedSelect } from './ui/AnimatedSelect'

interface Action {
  id: 'ai' | 'task' | 'smoke' | 'tx'
  icon: typeof Plus
  label: string
  color: string
  bg: string
}

const actions: Action[] = [
  { id: 'ai', icon: Bot, label: 'Tanya AI', color: '#5559B5', bg: 'rgba(85,89,181,0.16)' },
  { id: 'task', icon: CheckSquare, label: 'Tambah Task', color: '#10B981', bg: 'rgba(16,185,129,0.16)' },
  { id: 'smoke', icon: Cigarette, label: 'Log Rokok', color: '#F59E0B', bg: 'rgba(245,158,11,0.16)' },
  { id: 'tx', icon: CreditCard, label: 'Catat Transaksi', color: '#3F8F87', bg: 'rgba(63,143,135,0.16)' },
]

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.05, type: 'spring' as const, stiffness: 320, damping: 22 },
  }),
  exit: { opacity: 0, y: 12, scale: 0.85, transition: { duration: 0.12 } },
}

export function FloatingQuickAction() {
  const { isFabOpen, openFab, closeFab, toggleFab, openTx, openTask, openAI, toast } = useQuickAction()
  const [confirmBounce, setConfirmBounce] = useState(false)
  const [smoking, startSmoking] = useTransition()
  const fabRef = useRef<HTMLButtonElement>(null)

  // Escape closes the FAB
  useEffect(() => {
    if (!isFabOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFab()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isFabOpen, closeFab])

  const handleSmoke = () => {
    triggerHaptic(20)
    closeFab()
    startSmoking(async () => {
      try {
        const packs = await getActiveCigarettePacks()
        if (!packs || packs.length === 0) {
          toast('🚬 Belum ada pack aktif — restock dulu', 'error')
          return
        }
        await smokeOneStick(packs[0].id)
        setConfirmBounce(true)
        setTimeout(() => setConfirmBounce(false), 500)
        toast(`🚬 +1 dicatat — pack ${packs[0].brand} tersisa ${packs[0].remaining_sticks - 1}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal log rokok'
        toast(`❌ ${msg}`, 'error')
      }
    })
  }

  const handle = (id: Action['id']) => {
    triggerHaptic(15)
    if (id === 'ai') return openAI()
    if (id === 'task') return openTask()
    if (id === 'tx') return openTx()
    if (id === 'smoke') return handleSmoke()
  }

  return (
    <>
      {/* Backdrop when open */}
      <AnimatePresence>
        {isFabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeFab}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[10080]"
          />
        )}
      </AnimatePresence>

      {/* Container — positioned above the liquid glass nav pill */}
      <div className="fixed md:bottom-6 right-5 md:right-6 z-[10085] flex flex-col items-end gap-3"
        style={{ bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Action items */}
        <AnimatePresence>
          {isFabOpen && (
            <div className="flex flex-col gap-3 items-end">
              {actions.map((a, i) => (
                <motion.button
                  key={a.id}
                  custom={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={() => handle(a.id)}
                  className="group flex items-center gap-3 pl-4 pr-2 py-2 rounded-full glass-strong border border-[var(--border-strong)] shadow-lg hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <span className="text-xs font-semibold tracking-tight text-[var(--text-primary)]">{a.label}</span>
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: a.bg, color: a.color }}
                  >
                    <a.icon className="w-4.5 h-4.5 stroke-[1.75px]" />
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* The FAB itself */}
        <motion.button
          ref={fabRef}
          onClick={() => {
            triggerHaptic(10)
            toggleFab()
          }}
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: isFabOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`w-14 h-14 rounded-full flex items-center justify-center bg-[rgb(var(--color-primary))] text-white cursor-pointer relative ${isFabOpen ? 'shadow-glow-strong' : 'animate-glow-pulse'} ${confirmBounce ? 'fab-confirm' : ''}`}
          aria-label={isFabOpen ? 'Tutup quick action' : 'Buka quick action'}
        >
          {smoking ? (
            <Loader2 className="w-6 h-6 stroke-[2px] animate-spin" />
          ) : (
            <Plus className="w-6 h-6 stroke-[2px]" />
          )}
        </motion.button>
      </div>

      <QuickTransactionModal />
      <QuickTaskModal />
      <AIChatDrawer />
    </>
  )
}

/* ============================================================
 * Quick Transaction Modal
 * ============================================================ */
function QuickTransactionModal() {
  const { txModalOpen, closeTx, toast } = useQuickAction()
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amountRaw, setAmountRaw] = useState('')
  const [wallet, setWallet] = useState('Cashless')
  const [category, setCategory] = useState('F&B / Nongkrong')
  const [description, setDescription] = useState('')
  const [pending, startTransition] = useTransition()

  const formatAmount = (v: string) => {
    const digits = v.replace(/\D/g, '')
    if (!digits) return ''
    return Number(digits).toLocaleString('id-ID')
  }

  useEffect(() => {
    if (!txModalOpen) {
      setAmountRaw('')
      setDescription('')
      setType('expense')
      setWallet('Cashless')
      setCategory('F&B / Nongkrong')
    }
  }, [txModalOpen])

  useEffect(() => {
    if (!txModalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeTx() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [txModalOpen, closeTx])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const digits = amountRaw.replace(/\D/g, '')
    if (!digits || Number(digits) <= 0) {
      toast('Nominal tidak valid', 'error')
      return
    }
    if (!description.trim()) {
      toast('Deskripsi wajib diisi', 'error')
      return
    }

    const fd = new FormData()
    fd.set('amount', digits)
    fd.set('type', type)
    fd.set('description', description.trim())
    fd.set('wallet_name', wallet)
    fd.set('category', category)

    startTransition(async () => {
      try {
        await createTransaction(fd)
        toast(
          `${type === 'income' ? '💰' : '💸'} Tercatat: Rp${Number(digits).toLocaleString('id-ID')}`,
          'success',
        )
        closeTx()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal simpan transaksi'
        toast(`❌ ${msg}`, 'error')
      }
    })
  }

  const wallets = ['Cashless', 'Cash', 'Gopay', 'Dana', 'Livin', 'Ovo']
  const categories = [
    'F&B / Nongkrong',
    'Transport / Bensin',
    'Belanja / Bulanan',
    'Hobi / Hiburan',
    'Tabungan / Investasi',
    'Internet / Digital',
    'Lainnya',
  ]

  return (
    <AnimatePresence>
      {txModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeTx}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10100]"
          />
          <div className="fixed inset-0 z-[10110] flex items-end md:items-center justify-center p-3 pointer-events-none">
            <motion.form
              onSubmit={submit}
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="pointer-events-auto w-full max-w-md rounded-2xl glass-strong p-5 flex flex-col gap-4 shadow-[0_16px_40px_rgba(0,0,0,0.32)] border border-[var(--border-strong)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Catat Transaksi</h2>
                <button
                  type="button"
                  onClick={closeTx}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
                >
                  <X className="w-4 h-4 stroke-[1.5px]" />
                </button>
              </div>

              {/* Type toggle — segmented control with a sliding pill */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--bg-surface)]">
                {(['expense', 'income'] as const).map((t) => {
                  const active = type === t
                  const Icon = t === 'expense' ? ArrowDownCircle : ArrowUpCircle
                  const label = t === 'expense' ? 'Pengeluaran' : 'Pemasukan'
                  const activeText = t === 'expense' ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        active ? activeText : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="tx-type-pill"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          className="absolute inset-0 -z-10 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border-strong)]"
                        />
                      )}
                      <Icon className="w-4 h-4 stroke-[1.75px]" />
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Nominal</label>
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] focus-within:border-[rgba(var(--color-primary),0.5)] transition-all">
                  <span className="text-sm text-[var(--text-secondary)] font-medium">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={amountRaw}
                    onChange={(e) => setAmountRaw(formatAmount(e.target.value))}
                    placeholder="0"
                    className="flex-1 bg-transparent outline-none text-2xl font-semibold tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Deskripsi</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="cth: Kopi sore"
                  className="px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[rgba(var(--color-primary),0.7)] transition-all"
                />
              </div>

              {/* Wallet + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Dompet</label>
                  <AnimatedSelect
                    value={wallet}
                    onChange={setWallet}
                    options={wallets.map((w) => ({ value: w, label: w }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Kategori</label>
                  <AnimatedSelect
                    value={category}
                    onChange={setCategory}
                    options={categories.map((c) => ({ value: c, label: c }))}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="mt-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[rgb(var(--color-primary))] text-white font-semibold text-sm transition-all hover:bg-[rgba(var(--color-primary),0.88)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin stroke-[2px]" />}
                {pending ? 'Menyimpan…' : 'Simpan'}
              </button>
            </motion.form>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ============================================================
 * Quick Task Modal
 * ============================================================ */
function QuickTaskModal() {
  const { taskModalOpen, closeTask, toast } = useQuickAction()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!taskModalOpen) { setTitle(''); setDueDate('') }
  }, [taskModalOpen])

  useEffect(() => {
    if (!taskModalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeTask() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [taskModalOpen, closeTask])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toast('Judul wajib diisi', 'error')

    const fd = new FormData()
    fd.set('title', title.trim())
    fd.set('description', '')
    fd.set('due_date', dueDate)

    startTransition(async () => {
      try {
        await createTask(fd)
        toast('✅ Task ditambahkan', 'success')
        closeTask()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal simpan task'
        toast(`❌ ${msg}`, 'error')
      }
    })
  }

  return (
    <AnimatePresence>
      {taskModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeTask}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10100]"
          />
          <div className="fixed inset-0 z-[10110] flex items-end md:items-center justify-center p-3 pointer-events-none">
            <motion.form
              onSubmit={submit}
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="pointer-events-auto w-full max-w-md rounded-2xl glass-strong p-5 flex flex-col gap-4 shadow-[0_16px_40px_rgba(0,0,0,0.32)] border border-[var(--border-strong)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Tambah Task</h2>
                <button type="button" onClick={closeTask} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-md">
                  <X className="w-4 h-4 stroke-[1.5px]" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Judul</label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="cth: Selesaikan laporan"
                  className="px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[rgba(var(--color-primary),0.7)] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Due Date (opsional)</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] outline-none text-sm text-[var(--text-primary)] focus:border-[rgba(var(--color-primary),0.7)] transition-all [color-scheme:dark]"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="mt-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[rgb(var(--color-primary))] text-white font-semibold text-sm transition-all hover:bg-[rgba(var(--color-primary),0.88)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin stroke-[2px]" />}
                {pending ? 'Menyimpan…' : 'Tambah Task'}
              </button>
            </motion.form>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
