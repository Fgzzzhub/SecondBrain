'use client'

import { useState, useEffect, useRef, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Bot, CheckSquare, Cigarette, Wallet, Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useQuickAction } from './QuickActionProvider'
import { triggerHaptic } from '@/lib/haptic'
import { createTransaction, createTask, smokeOneStick, getActiveCigarettePacks } from '../actions'
import { AIChatDrawer } from './AIChatDrawer'
import { AnimatedSelect } from './ui/AnimatedSelect'

const ACTIONS = [
  {
    id: 'ai',
    icon: Bot,
    label: 'Tanya AI',
    iconColor: '#818CF8',
    iconBg: 'rgba(99,102,241,0.25)',
  },
  {
    id: 'task',
    icon: CheckSquare,
    label: 'Tambah Task',
    iconColor: '#34D399',
    iconBg: 'rgba(16,185,129,0.25)',
  },
  {
    id: 'smoke',
    icon: Cigarette,
    label: 'Log Rokok',
    iconColor: '#FCD34D',
    iconBg: 'rgba(245,158,11,0.25)',
  },
  {
    id: 'transaction',
    icon: Wallet,
    label: 'Catat Transaksi',
    iconColor: '#6366F1',
    iconBg: 'rgba(99,102,241,0.25)',
  },
]

export function FloatingQuickAction() {
  const { isFabOpen, openFab, closeFab, toggleFab, openTx, openTask, openAI, toast } = useQuickAction()
  const [confirmBounce, setConfirmBounce] = useState(false)
  const [smoking, startSmoking] = useTransition()
  const fabRef = useRef<HTMLButtonElement>(null)

  // Close on outside tap
  useEffect(() => {
    if (!isFabOpen) return
    const handle = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.fab-container')) {
        closeFab()
      }
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [isFabOpen, closeFab])

  // Lock scroll saat open
  useEffect(() => {
    document.body.style.overflow = isFabOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isFabOpen])

  const handleAction = async (id: string) => {
    closeFab()
    // Small delay to let the menu close animate smoothly
    await new Promise(r => setTimeout(r, 160))

    switch (id) {
      case 'ai':
        openAI()
        break
      case 'task':
        openTask()
        break
      case 'smoke':
        await handleSmoke()
        break
      case 'transaction':
        openTx()
        break
    }
  }

  const handleSmoke = () => {
    triggerHaptic(20)
    startSmoking(async () => {
      try {
        const packs = await getActiveCigarettePacks()
        if (!packs || packs.length === 0) {
          toast('🚬 Belum ada pack aktif — restock dulu', 'error')
          return
        }
        await smokeOneStick(packs[0].id)
        setConfirmBounce(true)
        setTimeout(() => setConfirmBounce(false), 2000)
        toast(`🚬 +1 dicatat — pack ${packs[0].brand} tersisa ${packs[0].remaining_sticks - 1}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal log rokok'
        toast(`❌ ${msg}`, 'error')
      }
    })
  }

  return (
    <>
      {/* Backdrop blur overlay saat open */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 85,
          background: 'rgba(0,0,0,0)',
          backdropFilter: isFabOpen ? 'blur(6px)' : 'blur(0px)',
          WebkitBackdropFilter: isFabOpen ? 'blur(6px)' : 'blur(0px)',
          opacity: isFabOpen ? 1 : 0,
          pointerEvents: isFabOpen ? 'all' : 'none',
          transition: 'opacity 0.3s ease, backdrop-filter 0.3s ease',
        }}
        onClick={closeFab}
      />

      {/* FAB container */}
      <div
        className="fab-container"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: 'calc(88px + 16px + env(safe-area-inset-bottom, 0px))', /* 88px navbar height + 16px gap + safe-area */
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '10px',
        }}
      >
        {/* Action items — muncul dari bawah ke atas dengan spring stagger */}
        {ACTIONS.map((action, index) => {
          const Icon = action.icon
          const reverseIndex = ACTIONS.length - 1 - index
          const delay = isFabOpen
            ? `${reverseIndex * 0.055}s`
            : `${index * 0.03}s`

          return (
            <div
              key={action.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                justifyContent: 'flex-end',

                /* Spring animation ala iOS */
                opacity: isFabOpen ? 1 : 0,
                transform: isFabOpen
                  ? 'translateY(0) scale(1)'
                  : 'translateY(16px) scale(0.85)',
                transition: isFabOpen
                  ? `opacity 0.35s ease ${delay}, transform 0.45s cubic-bezier(0.34,1.56,0.64,1) ${delay}`
                  : `opacity 0.2s ease ${delay}, transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}`,
                pointerEvents: isFabOpen ? 'all' : 'none',
              }}
            >
              {/* Label pill — liquid glass */}
              <button
                onClick={() => handleAction(action.id)}
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: '20px',
                  border: '0.5px solid rgba(255,255,255,0.12)',
                  background: 'rgba(28, 30, 48, 0.75)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  boxShadow: `
                    0 4px 16px rgba(0,0,0,0.35),
                    0 1px 0 rgba(255,255,255,0.08) inset,
                    0 -1px 0 rgba(0,0,0,0.2) inset
                  `,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.94)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.94)')}
                onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {/* Specular highlight di atas pill */}
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25) 50%, transparent)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }} />

                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.85)',
                  letterSpacing: '-0.01em',
                }}>
                  {action.label}
                </span>
              </button>

              {/* Icon bubble */}
              <div
                onClick={() => handleAction(action.id)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: action.iconBg,
                  border: `0.5px solid ${action.iconColor}30`,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: `0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)`,
                  flexShrink: 0,
                  transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.88)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.88)')}
                onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Icon size={17} color={action.iconColor} strokeWidth={2} />
              </div>
            </div>
          )
        })}

        {/* Main FAB button — liquid glass */}
        <button
          ref={fabRef}
          onClick={() => {
            triggerHaptic(10)
            toggleFab()
          }}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '0.5px solid rgba(255,255,255,0.15)',

            /* Liquid glass material */
            background: isFabOpen
              ? 'rgba(40, 42, 68, 0.85)'
              : 'rgba(99, 102, 241, 0.85)',
            backdropFilter: 'blur(20px) saturate(200%)',
            WebkitBackdropFilter: 'blur(20px) saturate(200%)',

            boxShadow: isFabOpen
              ? `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)`
              : `0 4px 20px rgba(99,102,241,0.4), 0 0 0 0.5px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.20)`,

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            position: 'relative',
            overflow: 'hidden',

            transition: 'background 0.35s ease, box-shadow 0.35s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.90)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.90)')}
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
          aria-label={isFabOpen ? 'Close' : 'Quick actions'}
        >
          {/* Specular highlight di atas FAB */}
          <span style={{
            position: 'absolute',
            top: '6px',
            left: '20%',
            right: '20%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 50%, transparent)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          {/* Icon rotasi ala iOS */}
          <div style={{
            transform: isFabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {smoking ? (
              <Loader2 className="w-5 h-5 stroke-[2.5px] animate-spin text-white" />
            ) : (
              <Plus
                size={22}
                color="rgba(255,255,255,0.95)"
                strokeWidth={2.5}
              />
            )}
          </div>
        </button>

        {/* Toast konfirmasi log rokok */}
        {confirmBounce && (
          <div style={{
            position: 'absolute',
            bottom: '64px',
            right: 0,
            background: 'rgba(28,30,48,0.9)',
            backdropFilter: 'blur(16px)',
            border: '0.5px solid rgba(255,255,255,0.10)',
            borderRadius: '12px',
            padding: '8px 14px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.8)',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            animation: 'fadeInUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            🚬 Rokok dicatat
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>


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
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!taskModalOpen) { setTitle(''); setDescription(''); setDueDate('') }
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
    fd.set('description', description.trim())
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
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Detail (opsional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi atau catatan detail task..."
                  rows={3}
                  className="px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[rgba(var(--color-primary),0.7)] transition-all resize-none"
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
