'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function UuidGenerator() {
  const t = useTranslations('tools')
  const [uuid, setUuid] = useState('')
  const [count, setCount] = useState(1)

  const generate = () => {
    const results: string[] = []
    for (let i = 0; i < count; i++) {
      results.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      }))
    }
    setUuid(results.join('\n'))
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-text-secondary">{t('count')}</label>
        <input type="number" min={1} max={100} value={count} onChange={e => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
          className="w-20 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30" />
        <button onClick={generate} className="px-6 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{t('generate')}</button>
      </div>
      {uuid && (
        <div className="relative">
          <textarea readOnly value={uuid} className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none" />
          <button onClick={() => navigator.clipboard.writeText(uuid)} className="absolute top-2 right-2 text-xs px-2 py-1 bg-accent text-white rounded-sm hover:opacity-90">{t('copy')}</button>
        </div>
      )}
    </div>
  )
}