import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'

import './app.css'

import { I18nProvider, createTranslator, useI18n } from './runtime/i18n'
import { primeRandomPool } from './runtime/tool-context'

// 启动即预取随机字节：wx.getRandomValues 是异步的，而 ToolContext.randomBytes 是同步签名，
// 同步路径（uuid / password / random / lorem）需要池子里先有货。
void primeRandomPool()

/**
 * tabBar 文案按当前语言覆写。
 * app.config.ts 的 tabBar.text 是构建期常量，改语言不会自动跟随，
 * 必须在语言变化时显式调 setTabBarItem。
 */
function TabBarLocalizer() {
  const { locale, t } = useI18n()

  useEffect(() => {
    const translator = createTranslator(locale)
    void Taro.setTabBarItem({ index: 0, text: translator.t('ui.tools') }).catch(() => undefined)
    // ⚠️ 用 auth.account 而不是 common.account —— common 命名空间没有 account 这个 key，
    // 写错了不会报错，只会把 key 名原样显示给用户（翻译器缺失时回退返回 key 本身）。
    void Taro.setTabBarItem({ index: 1, text: translator.t('auth.account') }).catch(
      () => undefined,
    )
  }, [locale, t])

  return null
}

export default function App({ children }: PropsWithChildren) {
  return (
    <I18nProvider>
      <TabBarLocalizer />
      {children}
    </I18nProvider>
  )
}
