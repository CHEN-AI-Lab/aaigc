'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function UserAgentParser() {
  const t = useTranslations('tools')
  const [ua, setUa] = useState('')

  useEffect(() => { setUa(navigator.userAgent) }, [])

  const parse = (s: string) => {
    const isChrome = s.includes('Chrome/') && !s.includes('Edg/')
    const isEdge = s.includes('Edg/')
    const isFirefox = s.includes('Firefox/')
    const isSafari = s.includes('Safari/') && !isChrome && !isEdge
    const isMobile = /Mobi|Android/i.test(s)
    const isWin = /Windows/i.test(s)
    const isMac = /Macintosh/i.test(s)
    const isLinux = /Linux/i.test(s) && !isMobile
    const isAndroid = /Android/i.test(s)
    const isIOS = /iPhone|iPad|iPod/i.test(s)
    return [
      { label: 'Browser', value: isChrome ? 'Chrome' : isEdge ? 'Edge' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Unknown' },
      { label: 'OS', value: isWin ? 'Windows' : isMac ? 'macOS' : isAndroid ? 'Android' : isIOS ? 'iOS' : isLinux ? 'Linux' : 'Unknown' },
      { label: 'Device', value: isMobile ? 'Mobile' : 'Desktop' },
    ]
  }

  const info = ua ? parse(ua) : []

  return (
    <div className="mt-6 space-y-4">
      <textarea value={ua} onChange={e => setUa(e.target.value)} rows={3}
        className="w-full p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary font-mono resize-none focus:outline-none focus:border-accent/30" />
      {info.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {info.map((item, i) => (
            <div key={i} className="p-4 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-center">
              <p className="text-xs text-text-secondary mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}