import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { locales, defaultLocale } from 'shared/constants/locales'

import enMessages from 'shared/messages/en.json'
import zhMessages from 'shared/messages/zh-CN.json'
import jaMessages from 'shared/messages/ja.json'

const messageMap: Record<string, Record<string, unknown>> = {
  'zh-CN': zhMessages as Record<string, unknown>,
  'en': enMessages as Record<string, unknown>,
  'ja': jaMessages as Record<string, unknown>,
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(locales as unknown as string[], requested) ? requested : defaultLocale

  return {
    locale,
    messages: messageMap[locale] ?? messageMap[defaultLocale],
    onError(err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Missing translation:', err.message)
      }
    },
    getMessageFallback({ key }) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Missing translation: ${key}`)
      }
      return key
    },
  }
})