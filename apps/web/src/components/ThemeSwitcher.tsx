'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

const THEMES = ['8', '12', '11', '4', '6']

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState('8')
  const [open, setOpen] = useState(false)
  const t = useTranslations('tools')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('aaigc-theme') || '8'
    setCurrent(saved)
    document.documentElement.className = `theme-${saved}`
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const switchTheme = (id: string) => {
    setCurrent(id)
    setOpen(false)
    document.documentElement.className = `theme-${id}`
    localStorage.setItem('aaigc-theme', id)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md bg-surface border border-[rgba(127,99,21,0.15)] text-text-secondary hover:text-accent shadow-sm transition-colors"
      >
        🎨 {t(`theme${current}`)}
        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md shadow-md min-w-[150px] z-50 overflow-hidden">
          {THEMES.map(id => (
            <button
              key={id}
              onClick={() => switchTheme(id)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                current === id ? 'text-accent font-medium bg-accent/5' : 'text-text-secondary hover:bg-accent/5'
              }`}
            >
              {t(`theme${id}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}