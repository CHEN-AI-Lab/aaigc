import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { locales, defaultLocale } from 'shared/constants/locales'

// 整文件加载：每个 locale 的 messages 会**全量**进 Web bundle（当前没有按端/按 namespace 切片）。
// 已知代价：CLI（cli.*）、桌面端等非 Web 端的文案也会一并打进 Web，量级为几 KB/语言，
// 相对 1500+ key 可忽略，因此**暂不做切片**。
// 若将来体积敏感，架构侧已有「按 namespace 切片」方案（T01.2），届时在这里改成按需组装即可。
import enMessages from 'shared/messages/en.json'
import zhMessages from 'shared/messages/zh-CN.json'
import jaMessages from 'shared/messages/ja.json'
import zhTwMessages from 'shared/messages/zh-TW.json'

const messageMap: Record<string, Record<string, unknown>> = {
  'zh-CN': zhMessages as Record<string, unknown>,
  'en': enMessages as Record<string, unknown>,
  'ja': jaMessages as Record<string, unknown>,
  'zh-TW': zhTwMessages as Record<string, unknown>,
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