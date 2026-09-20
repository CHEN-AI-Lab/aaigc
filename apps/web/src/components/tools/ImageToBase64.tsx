'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { MAX_IMAGE_BYTES, bytesToDataUrl, guessMimeType } from 'shared/tools/image-to-base64'

export default function ImageToBase64() {
  const t = useTranslations('tools')
  const [base64, setBase64] = useState('')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    // 旧行为：硬编码 5MB 上限、mime 缺省用空串 → 新行为：MAX_IMAGE_BYTES(5MB) + guessMimeType(按扩展名兜底)，已确认接受
    if (file.size > MAX_IMAGE_BYTES) { setError(t('fileTooLarge')); return }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (!(result instanceof ArrayBuffer)) { setError(t('failedToRead')); return }
      // 字节 → Data URL 由 shared 纯函数完成（不依赖 btoa，五端一致）
      setBase64(bytesToDataUrl(new Uint8Array(result), file.type || guessMimeType(file.name)))
    }
    reader.onerror = () => setError(t('failedToRead'))
    reader.readAsArrayBuffer(file)
  }, [t])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(base64)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [base64])

  return (
    <div className="mt-6 space-y-4">
      <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-sm bg-surface cursor-pointer hover:border-accent/30 transition-colors">
        <div className="text-center">
          <div className="text-3xl mb-2">📁</div>
          <p className="text-sm text-text-secondary">{t('dropImage')}</p>
          <p className="text-xs text-text-secondary mt-1">{t('maxSize')}</p>
        </div>
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
      {error && <p className="text-error text-sm">{error}</p>}
      {base64 && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <img src={base64} alt="Preview" className="w-16 h-16 object-cover rounded-sm border border-border" />
            <span className="text-xs text-text-secondary">{fileName}</span>
          </div>
          <div className="relative">
            <textarea readOnly value={base64} className="w-full h-36 p-3 bg-surface border border-border rounded-sm text-sm font-mono text-text-primary resize-none text-[11px]" />
            <button onClick={handleCopy}
              className={`text-xs px-2 py-1 rounded-sm transition-all duration-200 min-w-[4.5rem] text-center absolute top-2 right-6 ${
                copied
                  ? 'bg-success text-white scale-105'
                  : 'bg-accent text-white hover:opacity-90'
              }`}>
              {copied ? t('copied') : t('copy')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}