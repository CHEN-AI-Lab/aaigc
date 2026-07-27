import type { Locale } from '../types'

export const locales = ['en', 'zh-CN', 'zh-TW', 'ja'] as const
export const defaultLocale: Locale = 'en'

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export const localeNames: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'en': 'English',
  'ja': '日本語',
  'zh-TW': '繁體中文',
}