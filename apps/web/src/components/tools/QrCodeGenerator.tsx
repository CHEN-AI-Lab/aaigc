'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createToolContext } from 'shared/tools'
import { parseQrCode, runQrCode } from 'shared/tools/qrcode'

export default function QrCodeGenerator() {
  const t = useTranslations('tools')
  const [text, setText] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [error, setError] = useState('')

  const generate = async () => {
    setError('')
    // 输入校验与渲染参数归一化统一走 shared；矩阵生成仍由端侧 qrcode 库完成（T2）
    const parsed = parseQrCode({ text, width: 256, margin: 2 }, createToolContext())
    if (!parsed.ok) {
      setError(parsed.error.code === 'emptyInput' ? t('pleaseEnterText') : t('failedToGenerateQr'))
      return
    }
    const params = runQrCode(parsed.data, createToolContext())
    if (!params.ok) { setError(t('failedToGenerateQr')); return }
    try {
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(params.data.text, {
        width: params.data.width,
        margin: params.data.margin,
        color: { dark: params.data.dark, light: params.data.light },
      })
      setQrDataUrl(url)
    } catch {
      setError(t('failedToGenerateQr'))
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('enterTextOrUrl')} className="w-full h-24 p-3 bg-surface border border-border rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <button onClick={generate} className="px-6 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('generateQrCode')}</button>
      {error && <p className="text-error text-sm">{error}</p>}
      {qrDataUrl && (
        <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-sm shadow-warm-sm border border-border">
          <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
          <a href={qrDataUrl} download="qrcode.png" className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90 transition-opacity">
            {t('downloadPng')}
          </a>
        </div>
      )}
    </div>
  )
}