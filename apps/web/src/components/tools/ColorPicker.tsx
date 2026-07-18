'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export default function ColorPicker() {
  const t = useTranslations('tools')
  const [color, setColor] = useState('#fa520f')
  const [animIndex, setAnimIndex] = useState<number | null>(null)
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hex = color
  const rgb = `${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}`
  const hsl = (() => {
    const r = parseInt(color.slice(1, 3), 16) / 255
    const g = parseInt(color.slice(3, 5), 16) / 255
    const b = parseInt(color.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
        case g: h = ((b - r) / d + 2) * 60; break
        case b: h = ((r - g) / d + 4) * 60; break
      }
    }
    return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
  })()

  const presets = ['#fa520f','#ffa110','#ffd900','#ff8a00','#fb6424','#1f1f1f','#767d88','#fffaeb','#fff0c2','#3ecf8e','#4a90d9','#9b59b6','#e74c3c','#2ecc71','#f39c12']

  const handleCopy = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setAnimIndex(index)
    if (animTimer.current) clearTimeout(animTimer.current)
    animTimer.current = setTimeout(() => setAnimIndex(null), 400)
  }, [])

  const values = [
    { label: t('hex'), value: hex },
    { label: 'RGB', value: `rgb(${rgb})` },
    { label: 'HSL', value: hsl },
  ]

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center gap-6 p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.15)]">
        <div className="flex flex-col items-center gap-2">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-16 h-16 rounded-sm cursor-pointer border border-[rgba(127,99,21,0.15)]" />
          <span className="text-xs text-text-secondary">{t('pick')}</span>
        </div>
        <div className="flex-1 space-y-2">
          {values.map(({ label, value }, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs font-mono text-text-secondary w-10 shrink-0">{label}</span>
              <code className="text-sm text-text-primary font-mono flex-1 truncate">{value}</code>
              <button
                onClick={() => handleCopy(value, i)}
                className={`text-xs px-2 py-0.5 bg-accent text-white rounded-sm transition-all ${animIndex === i ? 'scale-110 opacity-70' : 'hover:opacity-90'}`}
              >
                {t('copy')}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-text-secondary mb-2">{t('presetColors')}</p>
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5">
          {presets.map(c => (
            <button key={c} onClick={() => setColor(c)} className="h-8 rounded-sm border border-[rgba(127,99,21,0.1)] cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
      </div>
    </div>
  )
}