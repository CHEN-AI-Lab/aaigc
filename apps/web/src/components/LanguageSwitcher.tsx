'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { locales, localeNames } from 'shared/constants/locales'
import { useCallback, useRef, useState, useEffect } from 'react'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const toggle = useCallback(() => setOpen(v => !v), [])

  const switchLocale = useCallback(
    (nextLocale: string) => {
      setOpen(false)
      router.replace(pathname, { locale: nextLocale })
    },
    [pathname, router]
  )

  const current = localeNames[locale as keyof typeof localeNames] || locale

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-accent hover:bg-surface transition-colors"
        title={current}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-md z-[60] w-max">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                locale === l ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-accent/10'
              }`}
            >
              {localeNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}