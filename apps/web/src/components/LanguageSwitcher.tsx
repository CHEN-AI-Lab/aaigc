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
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const switchLocale = useCallback(
    (nextLocale: string) => {
      setOpen(false)
      router.push(pathname, { locale: nextLocale })
    },
    [pathname, router]
  )

  const current = localeNames[locale as keyof typeof localeNames] || locale

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-8 h-8 rounded-sm hover:bg-[#fff0c2] transition-colors text-text-secondary text-lg"
        title={current}
      >
        <span>🌐</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[rgba(127,99,21,0.12)] shadow-warm-sm rounded-sm min-w-[120px] z-50">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[#fff0c2] ${
                locale === l ? 'font-medium text-accent' : 'text-text-primary'
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