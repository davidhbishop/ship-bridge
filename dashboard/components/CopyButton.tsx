'use client'

import { useState } from 'react'

export function CopyButton({ text, label = 'Copy for log' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <button type="button" className="button secondary" onClick={copy}>
      {copied ? 'Copied' : label}
    </button>
  )
}
