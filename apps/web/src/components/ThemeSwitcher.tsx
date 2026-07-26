'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

const THEMES = ['8', '12', '11', '4', '6']

const THEME_COLORS: Record<string, string> = {
  '8': '#2d6b2d',
  '12': '#a0522d',
  '11': '#0d9488',
  '4': '#38bdf8',
  '6': '#111111',
}

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

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-accent hover:bg-surface transition-colors"
        title={t(`theme${current}`)}
      >
        🎨
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-card border border-[rgba(127,99,21,0.15)] rounded-md shadow-md min-w-[150px] z-50 overflow-hidden">
          {THEMES.map(id => (
            <button
              key={id}
              onClick={() => {
                setCurrent(id)
                setOpen(false)
                document.documentElement.className = `theme-${id}`
                localStorage.setItem('aaigc-theme', id)
              }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                current === id ? 'font-medium' : 'text-text-secondary hover:bg-accent/10'
              }`}
              style={current === id ? { backgroundColor: THEME_COLORS[id] + '18', color: THEME_COLORS[id] } : undefined}
            >
              {t(`theme${id}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}