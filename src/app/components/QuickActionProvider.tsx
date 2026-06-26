'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type ToastTone = 'success' | 'error' | 'info'
interface Toast { id: number; text: string; tone: ToastTone }

interface QuickActionContextType {
  // FAB
  isFabOpen: boolean
  openFab: () => void
  closeFab: () => void
  toggleFab: () => void

  // Modals
  txModalOpen: boolean
  taskModalOpen: boolean
  aiOpen: boolean
  openTx: () => void
  closeTx: () => void
  openTask: () => void
  closeTask: () => void
  openAI: () => void
  closeAI: () => void

  // Toast
  toasts: Toast[]
  toast: (text: string, tone?: ToastTone) => void
  dismiss: (id: number) => void
}

const QuickActionContext = createContext<QuickActionContextType | undefined>(undefined)

export function QuickActionProvider({ children }: { children: ReactNode }) {
  const [isFabOpen, setFabOpen] = useState(false)
  const [txModalOpen, setTxOpen] = useState(false)
  const [taskModalOpen, setTaskOpen] = useState(false)
  const [aiOpen, setAIOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (text: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, text, tone }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }
  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <QuickActionContext.Provider
      value={{
        isFabOpen,
        openFab: () => setFabOpen(true),
        closeFab: () => setFabOpen(false),
        toggleFab: () => setFabOpen((v) => !v),
        txModalOpen,
        taskModalOpen,
        aiOpen,
        openTx: () => { setFabOpen(false); setTxOpen(true) },
        closeTx: () => setTxOpen(false),
        openTask: () => { setFabOpen(false); setTaskOpen(true) },
        closeTask: () => setTaskOpen(false),
        openAI: () => { setFabOpen(false); setAIOpen(true) },
        closeAI: () => setAIOpen(false),
        toasts,
        toast,
        dismiss,
      }}
    >
      {children}
      <ToastViewport />
    </QuickActionContext.Provider>
  )
}

export function useQuickAction() {
  const ctx = useContext(QuickActionContext)
  if (!ctx) throw new Error('useQuickAction must be used inside QuickActionProvider')
  return ctx
}

function ToastViewport() {
  const { toasts, dismiss } = useQuickAction()
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[10090] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto px-4 py-2.5 rounded-xl glass-strong text-xs font-medium tracking-tight shadow-[0_8px_30px_rgba(0,0,0,0.4)] ${
            t.tone === 'success'
              ? 'text-[var(--success)] border-[rgba(16,185,129,0.4)]'
              : t.tone === 'error'
                ? 'text-[var(--danger)] border-[rgba(239,68,68,0.4)]'
                : 'text-[var(--text-primary)]'
          }`}
        >
          {t.text}
        </button>
      ))}
    </div>
  )
}
