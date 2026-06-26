'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

type Variant = 'default' | 'elevated' | 'subtle'
type Padding = 'none' | 'sm' | 'md' | 'lg'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  glow?: boolean
  padding?: Padding
  as?: 'div' | 'section' | 'article'
  children: ReactNode
}

const paddingMap: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  {
    variant = 'default',
    glow = false,
    padding = 'md',
    className = '',
    children,
    ...rest
  },
  ref,
) {
  const variantClass =
    variant === 'elevated'
      ? 'glass-strong'
      : variant === 'subtle'
        ? 'bg-[var(--bg-surface)]/60 backdrop-blur-md border border-[var(--border)]'
        : 'glass'

  // Interactive cards get a subtle lift on hover (neutral elevation, no glow).
  const hoverGlow = glow
    ? 'hover:border-[var(--border-strong)] hover:-translate-y-0.5 hover:[box-shadow:var(--elevation-top),var(--shadow-card-hover)]'
    : ''

  return (
    <div
      ref={ref}
      className={`rounded-2xl transition-all duration-200 ${variantClass} ${paddingMap[padding]} ${hoverGlow} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
})
