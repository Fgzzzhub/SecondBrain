'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { GlassCard } from './GlassCard'

/** Animate a number from 0 → target on mount (easeOutCubic). Honors reduced-motion. */
function useCountUp(target: number, duration = 900): number {
  const [n, setN] = useState(target)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || target === 0) {
      setN(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(target * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setN(target)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return n
}

interface StatCardProps {
  label: string
  value: string | number
  delta?: { value: number; suffix?: string } // e.g. { value: -3.2, suffix: '%' }
  tone?: 'neutral' | 'positive' | 'negative'
  icon?: ReactNode
  href?: string
  onClick?: () => void
  className?: string
  /** Override default tone for the big number color. */
  numberColor?: 'auto' | 'primary' | 'success' | 'danger' | 'warning'
}

function toneColor(t: 'neutral' | 'positive' | 'negative') {
  if (t === 'positive') return 'text-[var(--success)]'
  if (t === 'negative') return 'text-[var(--danger)]'
  return 'text-[var(--text-primary)]'
}

function numColor(c: NonNullable<StatCardProps['numberColor']>) {
  switch (c) {
    case 'primary':
      return 'text-[rgb(var(--color-primary))]'
    case 'success':
      return 'text-[var(--success)]'
    case 'danger':
      return 'text-[var(--danger)]'
    case 'warning':
      return 'text-[var(--warning)]'
    default:
      return ''
  }
}

export function StatCard({
  label,
  value,
  delta,
  tone = 'neutral',
  icon,
  href,
  onClick,
  className = '',
  numberColor = 'auto',
}: StatCardProps) {
  const numberClass = numberColor === 'auto' ? toneColor(tone) : numColor(numberColor)

  // Count up when the value is a plain number; otherwise show as-is (e.g. currency strings).
  const isNumeric = typeof value === 'number' && Number.isFinite(value)
  const animated = useCountUp(isNumeric ? (value as number) : 0)
  const displayValue = isNumeric ? Math.round(animated).toLocaleString('id-ID') : value

  const deltaTone =
    delta == null
      ? 'neutral'
      : delta.value > 0
        ? 'positive'
        : delta.value < 0
          ? 'negative'
          : 'neutral'

  const DeltaIcon = deltaTone === 'positive' ? ArrowUpRight : deltaTone === 'negative' ? ArrowDownRight : Minus

  const body = (
    <GlassCard
      glow={!!href || !!onClick}
      padding="md"
      className={`group cursor-${href || onClick ? 'pointer' : 'default'} ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
          {label}
        </p>
        <span className="text-[var(--text-muted)] group-hover:text-[rgb(var(--color-primary))] transition-colors">
          {icon ?? (href ? <ArrowUpRight className="w-4 h-4 stroke-[1.5px]" /> : null)}
        </span>
      </div>

      <p className={`text-3xl font-semibold tracking-tight tabular-nums ${numberClass}`}>{displayValue}</p>

      {delta != null && (
        <div className="flex items-center gap-1 mt-2">
          <DeltaIcon
            className={`w-3.5 h-3.5 stroke-[1.5px] ${
              deltaTone === 'positive'
                ? 'text-[var(--success)]'
                : deltaTone === 'negative'
                  ? 'text-[var(--danger)]'
                  : 'text-[var(--text-muted)]'
            }`}
          />
          <span
            className={`text-xs font-medium tabular-nums ${
              deltaTone === 'positive'
                ? 'text-[var(--success)]'
                : deltaTone === 'negative'
                  ? 'text-[var(--danger)]'
                  : 'text-[var(--text-muted)]'
            }`}
          >
            {Math.abs(delta.value).toFixed(delta.value % 1 === 0 ? 0 : 1)}
            {delta.suffix ?? ''}
          </span>
        </div>
      )}
    </GlassCard>
  )

  if (href) {
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- intentional for client wrap
    return (
      <a href={href} className="block focus:outline-none">
        {body}
      </a>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left focus:outline-none">
        {body}
      </button>
    )
  }
  return body
}
