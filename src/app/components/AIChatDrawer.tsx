'use client'

import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react'
import { useQuickAction } from './QuickActionProvider'

interface Msg { role: 'user' | 'ai'; content: string }

const SUGGESTIONS = [
  'Bulan ini aku boros di mana?',
  'Berapa rata-rata rokokku minggu ini?',
  'Aku produktif nggak minggu ini?',
  'Prediksi saldo akhir bulan kalau pola ini terus?',
  'Kasih insight keuangan aku bulan ini',
]

export function AIChatDrawer() {
  const { aiOpen, closeAI } = useQuickAction()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!aiOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAI() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [aiOpen, closeAI])

  useEffect(() => {
    if (aiOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [aiOpen])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // auto-resize textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [input])

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const next: Msg[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: messages }),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Gagal menghubungi AI')
        setMessages([...next, { role: 'ai', content: `❌ ${errText || 'Error tidak diketahui'}` }])
      } else {
        const data = await res.json()
        setMessages([...next, { role: 'ai', content: data.reply || '(tidak ada jawaban)' }])
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      setMessages([...next, { role: 'ai', content: `❌ ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    send()
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <AnimatePresence>
      {aiOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAI}
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[10100]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            className="fixed top-0 right-0 h-[100dvh] w-full md:w-[420px] z-[10110] glass-strong border-l border-[var(--border-strong)] flex flex-col shadow-[-12px_0_40px_rgba(0,0,0,0.35)]"
          >
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(var(--color-primary),0.18)] border border-[rgba(var(--color-primary),0.4)]">
                  <Sparkles className="w-4 h-4 text-[rgb(var(--color-primary))] stroke-[1.75px]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">Tanya AI</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Gemini · membaca data kamu</span>
                </div>
              </div>
              <button
                onClick={closeAI}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <X className="w-4 h-4 stroke-[1.5px]" />
              </button>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 [&::-webkit-scrollbar]:hidden">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm text-[var(--text-primary)] font-medium">Hai 👋 mau ngobrol soal apa hari ini?</p>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Aku bisa lihat data finance, rokok, task, dan pomodoro kamu bulan ini.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Coba tanya:</span>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-left px-3 py-2.5 rounded-xl glass border border-[var(--border)] hover:border-[rgba(var(--color-primary),0.4)] hover:bg-[var(--bg-surface-hover)] text-xs text-[var(--text-primary)] transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <Bubble key={i} role={m.role} content={m.content} />
              ))}

              {loading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[rgba(var(--color-primary),0.18)] flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-[rgb(var(--color-primary))] stroke-[1.75px]" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm glass border border-[var(--border)] flex items-center gap-1.5">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary))]" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary))]" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary))]" />
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={submit}
              className="flex-shrink-0 p-3 border-t border-[var(--border)] flex items-end gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Tanya apa saja…"
                disabled={loading}
                className="flex-1 resize-none px-4 py-3 rounded-2xl glass border border-[var(--border)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[rgba(var(--color-primary),0.7)] transition-all max-h-[140px]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-11 h-11 flex-shrink-0 rounded-2xl bg-[rgb(var(--color-primary))] text-white flex items-center justify-center shadow-glow hover:shadow-glow-strong active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? <Loader2 className="w-4 h-4 stroke-[2px] animate-spin" /> : <Send className="w-4 h-4 stroke-[2px]" />}
              </button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function Bubble({ role, content }: { role: 'user' | 'ai'; content: string }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-[rgb(var(--color-primary))] text-white text-sm leading-relaxed whitespace-pre-wrap shadow-md">
          {content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[rgba(var(--color-primary),0.18)] flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-[rgb(var(--color-primary))] stroke-[1.75px]" />
      </div>
      <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tl-sm glass border border-[var(--border)] text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  )
}
