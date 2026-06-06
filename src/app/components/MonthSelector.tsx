'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format, addMonths, subMonths, parse } from 'date-fns'
import { triggerHaptic } from '@/lib/haptic'

interface MonthSelectorProps {
  currentMonth: string // Format: 'yyyy-MM'
}

export function MonthSelector({ currentMonth }: MonthSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const parsedMonth = parse(currentMonth, 'yyyy-MM', new Date())

  const handlePrevMonth = () => {
    triggerHaptic(10)
    const prev = subMonths(parsedMonth, 1)
    const prevStr = format(prev, 'yyyy-MM')
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', prevStr)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleNextMonth = () => {
    triggerHaptic(10)
    const next = addMonths(parsedMonth, 1)
    const nextStr = format(next, 'yyyy-MM')
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', nextStr)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-4 bg-neutral-900/40 border border-neutral-900 rounded-xl px-4 py-2 w-fit">
      <button
        onClick={handlePrevMonth}
        className="text-neutral-450 hover:text-white transition-colors cursor-pointer p-0.5"
        title="Previous Month"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2px]" />
      </button>
      <span className="text-xs font-semibold font-mono text-neutral-250 min-w-[110px] text-center uppercase tracking-wider">
        {format(parsedMonth, 'MMMM yyyy')}
      </span>
      <button
        onClick={handleNextMonth}
        className="text-neutral-455 hover:text-white transition-colors cursor-pointer p-0.5"
        title="Next Month"
      >
        <ChevronRight className="w-4 h-4 stroke-[2px]" />
      </button>
    </div>
  )
}
