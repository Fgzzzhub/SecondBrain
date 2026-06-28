'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Mic, MicOff, Send, Loader2 } from 'lucide-react'
import { useQuickAction } from './QuickActionProvider'
import { triggerHaptic } from '@/lib/haptic'
import { motion, AnimatePresence } from 'framer-motion'

export function MagicInput() {
  const router = useRouter()
  const { toast } = useQuickAction()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Initialize SpeechRecognition safely on client-side
  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'id-ID' // Set language to Indonesian as specified in user request example

      rec.onstart = () => {
        setIsListening(true)
        triggerHaptic(10)
      }

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setValue(prev => {
            const separator = prev ? ' ' : ''
            return prev + separator + transcript
          })
        }
      }

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e)
        toast('Gagal merekam suara. Coba lagi.', 'error')
        setIsListening(false)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    }
  }, [toast])

  const toggleListen = () => {
    triggerHaptic(12)
    if (!recognitionRef.current) {
      toast('Browser Anda tidak mendukung Voice-to-Text.', 'error')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Error starting speech recognition:', err)
        recognitionRef.current.stop()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const promptText = value.trim()
    if (!promptText || loading) return

    setLoading(true)
    triggerHaptic(15)

    try {
      const res = await fetch('/api/magic-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim data')
      }

      toast(data.message || 'Log berhasil dicatat!', 'success')
      setValue('')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast(err.message || 'Terjadi kesalahan sistem.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center w-full rounded-2xl border border-neutral-900 bg-neutral-950/40 p-1.5 focus-within:border-[rgba(var(--color-primary),0.5)] focus-within:shadow-[0_0_12px_rgba(var(--color-primary),0.08)] transition-all duration-300">
        
        {/* Magic Input Icon decoration */}
        <div className="pl-3.5 pr-2 flex items-center justify-center text-neutral-500 flex-shrink-0">
          <Sparkles className="w-4 h-4 text-[rgb(var(--color-primary))] stroke-[1.75px] animate-pulse" />
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Tulis aktivitas... (contoh: 'kopi 20k, rokok 2 batang')"
          disabled={loading}
          className="flex-1 bg-transparent py-2.5 text-sm text-[var(--text-primary)] placeholder-neutral-500 outline-none min-w-0 pr-2"
        />

        {/* Buttons (Mic & Send) */}
        <div className="flex items-center gap-1.5 pr-1 flex-shrink-0 z-20">
          {/* Microphone trigger */}
          <button
            type="button"
            onClick={toggleListen}
            disabled={loading}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center relative ${
              isListening
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 border border-transparent'
            }`}
          >
            {isListening && (
              <span className="absolute inset-0 rounded-xl bg-red-500/20 animate-ping pointer-events-none" />
            )}
            {isListening ? (
              <MicOff className="w-4 h-4 stroke-[1.75px]" />
            ) : (
              <Mic className="w-4 h-4 stroke-[1.75px]" />
            )}
          </button>

          {/* Send Submit Button */}
          <button
            type="submit"
            disabled={loading || !value.trim()}
            aria-label="Send natural language prompt"
            className="p-2 rounded-xl bg-[rgb(var(--color-primary))] text-white hover:bg-[rgba(var(--color-primary),0.9)] transition-all cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 stroke-[2px] animate-spin" />
            ) : (
              <Send className="w-4 h-4 stroke-[2px]" />
            )}
          </button>
        </div>

      </div>
    </form>
  )
}
