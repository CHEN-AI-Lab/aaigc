'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

const THEMES = [
  { id: '8', name: '苔绿', nameEn: 'Sage Green', nameJa: '苔緑' },
  { id: '12', name: '暖沙陶土', nameEn: 'Warm Terracotta', nameJa: '暖色テラコッタ' },
  { id: '11', name: '石板青绿', nameEn: 'Slate Teal', nameJa: 'スレートティール' },
  { id: '4', name: '深色模式', nameEn: 'Dark Mode', nameJa: 'ダークモード' },
  { id: '6', name: '极简灰', nameEn: 'Minimal Gray', nameJa: 'ミニマルグレー' },
]

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState('8')
  const [open, setOpen] = useState(false)
  const t = useTranslations('footer')

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

  const theme = THEMES.find(th => th.id === current)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors"
      >
        🎨 {theme?.name || '主题'}
        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm shadow-warm-sm min-w-[140px] z-50">
          {THEMES.map(th => (
            <button
              key={th.id}
              onClick={() => switchTheme(th.id)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-accent/10 transition-colors ${
                current === th.id ? 'text-accent font-medium' : 'text-text-secondary'
              }`}
            >
              {th.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}