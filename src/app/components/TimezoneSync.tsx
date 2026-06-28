'use client'

import { useEffect } from 'react'

export function TimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
      return match ? match[2] : null
    }

    const cookieVal = getCookie('user-timezone')
    if (!cookieVal || decodeURIComponent(cookieVal) !== tz) {
      document.cookie = `user-timezone=${encodeURIComponent(tz)}; path=/; max-age=31536000; SameSite=Lax`
      // Reload the page once to apply the cookie to the current session / render
      window.location.reload()
    }
  }, [])

  return null
}
