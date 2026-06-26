'use client'

import { useState, useEffect, useRef } from 'react'
import { Timer, Play, Pause, RotateCcw, X, ChevronUp, ChevronDown } from 'lucide-react'

export function Pomodoro() {
  const [time, setTime] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [isExpanded, setIsExpanded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            // Switch modes or reset
            setIsActive(false)
            if (intervalRef.current) clearInterval(intervalRef.current)
            const nextMode = mode === 'work' ? 'break' : 'work'
            setMode(nextMode)

            // Persist the completed session (mode that JUST finished)
            const justFinishedMode = mode
            const justFinishedMinutes = justFinishedMode === 'work' ? 25 : 5
            import('../actions').then(({ logPomodoroSession }) => {
              logPomodoroSession(justFinishedMinutes, justFinishedMode).catch(() => {})
            })

            const alertMsg = nextMode === 'break'
              ? '🍅 Pomodoro Completed! Time to take a break.'
              : '⚡ Break Completed! Ready to focus?'

            // Invoke the client-side Telegram notification utility
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

  const toggleTimer = () => setIsActive(!isActive)

  const resetTimer = () => {
    setIsActive(false)
    setTime(mode === 'work' ? 25 * 60 : 5 * 60)
  }

  const switchMode = (newMode: 'work' | 'break') => {
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
    <div className="fixed bottom-20 md:bottom-6 right-6 z-[10005] flex flex-col items-end">
      {isExpanded ? (
        <div className="w-64 p-5 rounded-2xl border border-neutral-900 bg-neutral-950/95 backdrop-blur-md shadow-2xl flex flex-col gap-4 transition-all">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-neutral-400 stroke-[1.5px]" />
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                {mode === 'work' ? 'Focus' : 'Break'}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <ChevronDown className="w-4 h-4 stroke-[1.5px]" />
            </button>
          </div>

          {/* Time Display */}
          <div className="text-center py-2">
            <span className="text-4xl font-semibold tracking-tight text-white font-mono">
              {formatTime(time)}
            </span>
          </div>

          {/* Mode Switchers */}
          <div className="flex gap-2">
            <button
              onClick={() => switchMode('work')}
              className={`flex-1 py-1 rounded text-[10px] font-medium border transition-colors ${
                mode === 'work' 
                  ? 'border-neutral-700 bg-neutral-900 text-white' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Work
            </button>
            <button
              onClick={() => switchMode('break')}
              className={`flex-1 py-1 rounded text-[10px] font-medium border transition-colors ${
                mode === 'break' 
                  ? 'border-neutral-700 bg-neutral-900 text-white' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Break
            </button>
          </div>

          {/* Controls */}
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={toggleTimer}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-neutral-950 hover:bg-neutral-200 transition-colors"
            >
              {isActive ? (
                <Pause className="w-4 h-4 stroke-[2px]" />
              ) : (
                <Play className="w-4 h-4 fill-neutral-950 stroke-[2px] translate-x-[1px]" />
              )}
            </button>
            <button
              onClick={resetTimer}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4 stroke-[1.5px]" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white shadow-lg transition-all"
        >
          <Timer className="w-5 h-5 stroke-[1.5px]" />
          {isActive && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-neutral-950 text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
              {Math.floor(time / 60)}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
