'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function IpLookup() {
  const t = useTranslations('tools')
  const [ip, setIp] = useState('')
  const [location, setLocation] = useState('')
  const [isp, setIsp] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/tools/ip-lookup')
      .then(r => r.json())
      .then(d => {
        if (d.ip) {
          setIp(d.ip)
          setLocation(d.location || '')
          setIsp(d.isp || '')
        } else {
          setError(d.error || t('conversionFailed'))
        }
        setLoading(false)
      })
      .catch(() => { setError(t('conversionFailed')); setLoading(false) })
  }, [t])

  return (
    <div className="mt-6 space-y-4">
      <div className="p-6 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm">
        {loading && <p className="text-text-secondary text-center">Loading...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {!loading && !error && (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-xs text-text-secondary mb-1">{t('ip-lookup.name')}</p>
              <p className="text-2xl font-mono font-semibold text-text-primary">{ip}</p>
            </div>
            <div className="border-t border-[rgba(127,99,21,0.1)] pt-3 grid grid-cols-2 gap-3 text-sm">
              {location && (
                <div>
                  <p className="text-xs text-text-secondary">Location</p>
                  <p className="text-text-primary">{location}</p>
                </div>
              )}
              {isp && (
                <div>
                  <p className="text-xs text-text-secondary">ISP</p>
                  <p className="text-text-primary">{isp}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}