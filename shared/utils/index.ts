/**
 * Get locale-aware display text.
 * Falls back to zh when locale is not en.
 */
export function displayText(locale: string, zh: string, en: string): string {
  return locale === 'en' || locale.startsWith('en') ? en : zh
}