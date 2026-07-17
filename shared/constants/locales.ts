import type { Locale } from '../types'

export const locales = ['zh-CN', 'en'] as const
export const defaultLocale: Locale = 'en'

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export const localeNames: Record<Locale, string> = {
  'zh-CN': '中文',
  'en': 'English',
}