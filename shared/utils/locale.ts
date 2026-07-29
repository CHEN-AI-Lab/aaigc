/**
 * Get locale-aware display text from bilingual/trilingual data.
 * Falls back: ja → en → zh-CN
 */
export function dt(locale: string, en: string, zh: string, ja?: string): string {
  if (locale === 'ja' && ja) return ja
  if (locale === 'zh-CN') return zh
  return en
}

/**
 * Get locale-aware date formatting locale string.
 */
export function dateLocale(locale: string): string {
  if (locale === 'ja') return 'ja-JP'
  if (locale === 'en') return 'en-US'
  return 'zh-CN'
}