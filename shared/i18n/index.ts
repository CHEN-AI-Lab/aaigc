export function t(locale: string, zh: string, en: string): string {
  return locale === 'en' || locale.startsWith('en') ? en : zh
}