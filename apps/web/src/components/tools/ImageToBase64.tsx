'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export default function ImageToBase64() {
  const t = useTranslations('tools')
  const [base64, setBase64] = useState('')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError(t('fileTooLarge')); return }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setBase64(reader.result as string)
    reader.onerror = () => setError(t('failedToRead'))
    reader.readAsDataURL(file)
  }, [t])

  return (
    <div className="mt-6 space-y-4">
      <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-[rgba(127,99,21,0.2)] rounded-sm bg-surface cursor-pointer hover:border-accent/30 transition-colors">
        <div className="text-center">
          <div className="text-3xl mb-2">📁</div>
          <p className="text-sm text-text-secondary">{t('dropImage')}</p>
          <p className="text-xs text-text-secondary mt-1">{t('maxSize')}</p>
        </div>
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {base64 && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <img src={base64} alt="Preview" className="w-16 h-16 object-cover rounded-sm border border-[rgba(127,99,21,0.15)]" />
            <span className="text-xs text-text-secondary">{fileName}</span>
          </div>
          <div className="relative">
            <textarea readOnly value={base64} className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none text-[11px]" />
            <button onClick={() => navigator.clipboard.writeText(base64)} className="absolute top-2 right-2 text-xs px-2 py-1 bg-accent text-white rounded-sm hover:opacity-90">{t('copy')}</button>
          </div>
        </div>
      )}
    </div>
  )
}