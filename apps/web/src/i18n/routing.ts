import { defineRouting } from 'next-intl/routing'
import { locales, defaultLocale } from 'shared/constants/locales'

export const routing = defineRouting({
  locales: locales as unknown as string[],
  defaultLocale,
  localePrefix: 'always',
})