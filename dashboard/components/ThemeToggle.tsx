'use client'

import { useEffect, useState } from 'react'

const THEMES = ['auto', 'light', 'dark', 'night'] as const
type Theme = (typeof THEMES)[number]
const LABELS: Record<Theme, string> = { auto: 'Auto', light: 'Day', dark: 'Dark', night: 'Night (red)' }

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme') as Theme | null
      if (saved && THEMES.includes(saved)) setTheme(saved)
    } catch {}
  }, [])

  function cycle() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
    setTheme(next)
    try {
      if (next === 'auto') {
        localStorage.removeItem('theme')
        delete document.documentElement.dataset.theme
      } else {
        localStorage.setItem('theme', next)
        document.documentElement.dataset.theme = next
      }
    } catch {}
  }

  return (
    <button type="button" className="chip" onClick={cycle} title="Change colour scheme">
      {LABELS[theme]}
    </button>
  )
}
