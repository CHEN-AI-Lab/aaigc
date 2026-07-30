'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function QrCodeGenerator() {
  const t = useTranslations('tools')
  const [text, setText] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [error, setError] = useState('')

  const generate = async () => {
    setError('')
    if (!text.trim()) { setError(t('pleaseEnterText')); return }
    try {
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(text, { width: 256, margin: 2, color: { dark: '#1f1f1f', light: '#ffffff' } })
      setQrDataUrl(url)
    } catch {
      setError(t('failedToGenerateQr'))
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('enterTextOrUrl')} className="w-full h-24 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <button onClick={generate} className="px-6 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90">{t('generateQrCode')}</button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {qrDataUrl && (
        <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-md shadow-warm-sm border border-[rgba(127,99,21,0.1)]">
          <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
          <a href={qrDataUrl} download="qrcode.png" className="px-4 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90 transition-opacity">
            {t('downloadPng')}
          </a>
        </div>
      )}
    </div>
  )
}