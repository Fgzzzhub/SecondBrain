import React from 'react'

interface AutoBadgeProps {
  status: 'manual' | 'auto' | 'pending_review'
  confidence?: number
}

export function AutoBadge({ status, confidence }: AutoBadgeProps) {
  if (status === 'manual') return null

  if (status === 'pending_review') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-amber-500/10 text-amber-500 border border-amber-500/20">
        ⚡ Review ({confidence ?? 0}%)
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
      ⚡ Auto
    </span>
  )
}
