'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export default function CopyButton({ text, className }: { text: string; className?: string }) {
  const t = useTranslations('tools')
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-2 py-1 rounded-sm transition-all duration-200 shrink-0 ${
        copied
          ? 'bg-green-500 text-white scale-105'
          : 'bg-accent text-white hover:opacity-90'
      } ${className || ''}`}
    >
      {copied ? (t('copied') || 'Copied!') : t('copy')}
    </button>
  )
}