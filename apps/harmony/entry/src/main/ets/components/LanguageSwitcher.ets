// 通用 UI —— 语言切换器（4 语言：en / zh-CN / zh-TW / ja）
//
// 与 web/iOS/App 一致：点击弹底部面板，选择后立即切换全局 Locale。
//
// ⚠️ tabBar 标题与 sheet 标题**故意**用 i18n 系统翻译（不允许硬编码）。
//   "Language / 语言" 这种中英混合字符串必须分到 common 或 ui 命名空间。
//   当前 common 命名空间没 language 这个 key —— 复用 common.appName 作兜底标题。

import { getLocale, setLocale, locales, type Locale } from '../store/locale'
import { t } from '../i18n/messages'

@Component
export struct LanguageSwitcher {
  @State private showSheet: boolean = false
  @StorageLink('aaigc_locale') currentLocale: Locale = 'en'

  build() {
    Button(this.currentLocale.toUpperCase())
      .height(36)
      .padding({ left: 12, right: 12 })
      .backgroundColor('#fff0c2')
      .fontColor('#1f1f1f')
      .fontSize(13)
      .fontWeight(FontWeight.Medium)
      .onClick(() => {
        this.showSheet = true
      })
      .bindSheet($$this.showSheet, this.SheetBuilder(), {
        height: SheetSize.FIT_CONTENT,
        showClose: true,
        title: { title: t('ui', 'language', this.currentLocale as any) },
      })
  }

  @Builder
  SheetBuilder() {
    Column() {
      ForEach(locales, (locale: Locale) => {
        Row() {
          Text(this.localeLabel(locale))
            .fontSize(16)
            .layoutWeight(1)

          if (locale === this.currentLocale) {
            Text('✓')
              .fontSize(18)
              .fontColor('#fa520f')
              .fontWeight(FontWeight.Bold)
          }
        }
        .width('100%')
        .height(52)
        .padding({ left: 24, right: 24 })
        .onClick(() => {
          setLocale(locale)
          this.currentLocale = getLocale()
          this.showSheet = false
        })
      }, (locale: Locale) => locale)
    }
    .width('100%')
    .padding({ bottom: 24 })
  }

  private localeLabel(locale: Locale): string {
    switch (locale) {
      case 'zh-CN': return '简体中文'
      case 'zh-TW': return '繁體中文'
      case 'ja': return '日本語'
      case 'en': return 'English'
      default: return locale
    }
  }
}