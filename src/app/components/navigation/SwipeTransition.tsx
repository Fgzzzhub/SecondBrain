'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
}

export function SwipeTransition({ children }: Props) {
  const pathname = usePathname()
  const [animClass, setAnimClass] = useState('')
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    if (pathname === prevPathRef.current) return

    const direction = sessionStorage.getItem('nav-direction') || 'left'
    sessionStorage.removeItem('nav-direction')

    const enterClass = direction === 'left'
      ? 'page-slide-enter-right'
      : 'page-slide-enter-left'

    setAnimClass(enterClass)

    const timeout = setTimeout(() => setAnimClass(''), 400)

    prevPathRef.current = pathname
    return () => clearTimeout(timeout)
  }, [pathname])

  return (
    <div className={`page-container ${animClass}`}>
      {children}
    </div>
  )
}
