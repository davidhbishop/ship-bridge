'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Re-fetches the page every few minutes and whenever the screen wakes, so a
// phone left on the chart table shows current times without a manual reload.
export function AutoRefresh({ minutes = 5 }: { minutes?: number }) {
  const router = useRouter()
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), minutes * 60 * 1000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router, minutes])
  return null
}
