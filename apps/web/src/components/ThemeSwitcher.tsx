'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

const THEMES = ['8', '12', '11', '4', '6']

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState('8')
  const [open, setOpen] = useState(false)
  const t = useTranslations('tools')

  useEffect(() => {
    const saved = localStorage.getItem('aaigc-theme') || '8'
    setCurrent(saved)
    document.documentElement.className = `theme-${saved}`
  }, [])

  const switchTheme = (id: string) => {
    setCurrent(id)
    setOpen(false)
    document.documentElement.className = `theme-${id}`
    localStorage.setItem('aaigc-theme', id)
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors"
      >
        🎨 {t(`theme${current}`)}
        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm shadow-warm-sm min-w-[140px] z-50">
          {THEMES.map(id => (
            <button
              key={id}
              onClick={() => switchTheme(id)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-accent/10 transition-colors ${
                current === id ? 'text-accent font-medium' : 'text-text-secondary'
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