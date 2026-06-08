'use client'

import { useState, useEffect, useRef } from 'react'
import { Timer, Play, Pause, RotateCcw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { triggerHaptic } from '@/lib/haptic'

export function TasksPomodoro() {
  const [isOpen, setIsOpen] = useState(false)
  const [time, setTime] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            setIsActive(false)
            if (intervalRef.current) clearInterval(intervalRef.current)
            const nextMode = mode === 'work' ? 'break' : 'work'
            setMode(nextMode)

            const alertMsg = nextMode === 'break' 
              ? '🍅 Pomodoro Completed! Time to take a break.' 
              : '⚡ Break Completed! Ready to focus?'

            // Send notification
            import('@/lib/notifications').then(({ sendTelegramNotification }) => {
              sendTelegramNotification(alertMsg)
            })

            alert(nextMode === 'break' ? 'Time for a break!' : 'Time to focus!')
            return nextMode === 'work' ? 25 * 60 : 5 * 60
          }
          return prevTime - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, mode])

  const toggleTimer = () => {
    triggerHaptic(20)
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    triggerHaptic(15)
    setIsActive(false)
    setTime(mode === 'work' ? 25 * 60 : 5 * 60)
  }

  const switchMode = (newMode: 'work' | 'break') => {
    triggerHaptic(15)
    setIsActive(false)
    setMode(newMode)
    setTime(newMode === 'work' ? 25 * 60 : 5 * 60)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          triggerHaptic(30)
          setIsOpen(!isOpen)
        }}
        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
          isOpen
            ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-[rgb(var(--color-primary))]'
            : 'bg-white dark:bg-neutral-950/20 border-neutral-200 dark:border-neutral-900 text-neutral-500 hover:text-neutral-750 dark:hover:text-neutral-305'
        }`}
      >
        <Timer className="w-4.5 h-4.5 stroke-[1.5px]" />
        {isActive && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[rgb(var(--color-primary))] text-white text-[8px] font-mono font-bold rounded-full flex items-center justify-center">
            {Math.floor(time / 60)}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="absolute right-0 top-11 z-50 w-64 p-5 rounded-2xl border border-neutral-250 dark:border-neutral-900 bg-white dark:bg-neutral-950/95 backdrop-blur-md shadow-xl flex flex-col gap-4"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-neutral-450 stroke-[1.5px]" />
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {mode === 'work' ? 'Focus Session' : 'Break Time'}
                </span>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(10)
                  setIsOpen(false)
                }}
                className="text-neutral-450 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.5px]" />
              </button>
            </div>

            {/* Time Display */}
            <div className="text-center py-1">
              <span className="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white font-mono">
                {formatTime(time)}
              </span>
            </div>

            {/* Mode Switchers */}
            <div className="flex gap-2">
              <button
                onClick={() => switchMode('work')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                  mode === 'work'
                    ? 'border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                Work
              </button>
              <button
                onClick={() => switchMode('break')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                  mode === 'break'
                    ? 'border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                Break
              </button>
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center pt-1.5">
              <button
                onClick={toggleTimer}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-neutral-950 hover:bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm"
              >
                {isActive ? (
                  <Pause className="w-3.5 h-3.5 stroke-[2px]" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current stroke-[2px] translate-x-[1px]" />
                )}
              </button>
              <button
                onClick={resetTimer}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-neutral-250 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[1.5px]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
