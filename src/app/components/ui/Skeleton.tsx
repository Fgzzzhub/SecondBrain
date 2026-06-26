import { type CSSProperties } from 'react'

/**
 * A single shimmering placeholder block. Pass sizing/rounding via className
 * (e.g. `h-4 w-32 rounded-md`). Defaults to a rounded-lg block.
 */
export function Skeleton({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return <div className={`skeleton rounded-lg ${className}`} style={style} aria-hidden="true" />
}
