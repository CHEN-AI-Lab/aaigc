'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'

export default function QrCodeGenerator() {
  const locale = useLocale()
  const [text, setText] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [error, setError] = useState('')

  const generate = async () => {
    setError('')
    if (!text.trim()) { setError(locale === 'en' ? 'Please enter text' : '请输入文本'); return }
    try {
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(text, { width: 256, margin: 2, color: { dark: '#1f1f1f', light: '#ffffff' } })
      setQrDataUrl(url)
    } catch {
      setError(locale === 'en' ? 'Failed to generate QR code' : '二维码生成失败')
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={locale === 'en' ? 'Enter text or URL...' : '输入文本或 URL...'} className="w-full h-24 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <button onClick={generate} className="px-6 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Generate QR Code' : '生成二维码'}</button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {qrDataUrl && (
        <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-sm shadow-warm-sm">
          <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
          <a href={qrDataUrl} download="qrcode.png" className="text-xs px-4 py-2 bg-surface text-text-primary rounded-sm hover:text-accent transition-colors border border-[rgba(127,99,21,0.15)]">
            {locale === 'en' ? 'Download PNG' : '下载 PNG'}
          </a>
        </div>
      )}
    </div>
  )
}