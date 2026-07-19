/**
 * Get locale-aware display text from bilingual data.
 * Falls back to English for unsupported locales (e.g. Japanese).
 */
export function displayText(locale: string, en: string, zh: string): string {
  return locale === 'zh-CN' ? zh : en
}

/**
 * Get locale-aware date formatting locale string.
 */
export function dateLocale(locale: string): string {
  if (locale === 'ja') return 'ja-JP'
  if (locale === 'en') return 'en-US'
  return 'zh-CN'
}