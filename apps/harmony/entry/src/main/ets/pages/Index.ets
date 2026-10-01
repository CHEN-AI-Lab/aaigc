// pages/Index —— 鸿蒙 App 首页
//
// 4 个 Tab：Home（Hero + 热门工具） / Tools（按分类） / Products（11 个产品） / About
//
// 演示：
//   1. ArkUI 声明式 UI（@Entry + @Component + Tabs）
//   2. shared/data + shared/constants 跨端复用
//   3. 4 语言 i18n 切换（持久化到 PersistentStorage）
//
// 关键：这里**完全没用** React/JSX/View/Text —— 全部 ArkUI 组件。
// shared/* 通过 ohpm + workspace:* 跨端引用。

import { tools, products, categoriesWithTools } from '../data/index'
import type { ToolMeta } from 'shared/data/tools'
import { t } from '../i18n/messages'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { CategoryHeader } from '../components/CategoryHeader'
import { ToolCard } from '../components/ToolCard'
import { ProductCard } from '../components/ProductCard'
import { getThemeMode, toggleTheme, type ThemeMode } from '../components/theme/colors'

@Entry
@Component
struct Index {
  @StorageLink('aaigc_locale') locale: string = 'en'
  @StorageLink('aaigc_theme_mode') themeMode: ThemeMode = 'light'
  @State private activeTab: number = 0

  private get tabs(): string[] {
    return [
      t('nav', 'home', this.locale as any),
      t('nav', 'tools', this.locale as any),
      t('nav', 'products', this.locale as any),
      t('nav', 'about', this.locale as any),
    ]
  }

  private onToolTap(tool: ToolMeta) {
    this.getUIContext().getRouter().pushUrl({
      url: 'pages/ToolDetail',
      params: { toolId: tool.id },
    }).catch((err: object) => {
      console.error('[AAIGC] pushUrl ToolDetail failed:', JSON.stringify(err))
    })
  }

  private async onThemeToggle() {
    await toggleTheme()
    console.log('[AAIGC] theme toggled to', getThemeMode())
  }

  build() {
    Column() {
      // ─── 顶部导航 ─────────────────────────────
      Row() {
        Column() {
          Text(t('common', 'appName', this.locale as any))
            .fontSize(20)
            .fontWeight(FontWeight.Bold)
            .fontColor('#1f1f1f')

          Text(t('common', 'tagline', this.locale as any))
            .fontSize(12)
            .fontColor('#767d88')
            .margin({ top: 2 })
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)

        LanguageSwitcher()

        Button(this.themeMode === 'dark' ? '☀' : '☾')
          .width(36)
          .height(36)
          .backgroundColor('transparent')
          .fontColor(this.themeMode === 'dark' ? '#ffa110' : '#767d88')
          .fontSize(20)
          .margin({ left: 8 })
          .onClick(() => this.onThemeToggle())
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 12 })
      .backgroundColor(this.themeMode === 'dark' ? '#1a1612' : '#fffaeb')

      // ─── Tabs 切换 ─────────────────────────────
      Tabs({ barPosition: BarPosition.Start, index: this.activeTab }) {
        TabContent() { this.HomeTab() }.tabBar(this.tabBar(this.tabs[0], 0))
        TabContent() { this.ToolsTab() }.tabBar(this.tabBar(this.tabs[1], 1))
        TabContent() { this.ProductsTab() }.tabBar(this.tabBar(this.tabs[2], 2))
        TabContent() { this.AboutTab() }.tabBar(this.tabBar(this.tabs[3], 3))
      }
      .barMode(BarMode.Fixed)
      .backgroundColor(this.themeMode === 'dark' ? '#1a1612' : '#fffaeb')
      .layoutWeight(1)
      .onChange((index: number) => {
        this.activeTab = index
      })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(this.themeMode === 'dark' ? '#1a1612' : '#fffaeb')
  }

  // ─── Home Tab ──────────────────────────────────
  @Builder
  HomeTab() {
    Scroll() {
      Column() {
        // Hero 区
        Column() {
          Text(t('home', 'heroSubtitle', this.locale as any))
            .fontSize(28)
            .fontWeight(FontWeight.Bold)
            .fontColor('#1f1f1f')
            .margin({ bottom: 8 })

          Text(t('common', 'tagline', this.locale as any))
            .fontSize(14)
            .fontColor('#767d88')

          Row({ space: 12 }) {
            Button(t('home', 'heroProducts', this.locale as any))
              .layoutWeight(1)
              .height(44)
              .backgroundColor('#fa520f')
              .fontColor('#ffffff')
              .onClick(() => { this.activeTab = 2 })

            Button(t('home', 'heroTools', this.locale as any))
              .layoutWeight(1)
              .height(44)
              .backgroundColor('#ffa110')
              .fontColor('#1f1f1f')
              .onClick(() => { this.activeTab = 1 })
          }
          .width('100%')
          .padding({ left: 16, right: 16, top: 20, bottom: 0 })
        }
        .width('100%')
        .padding({ top: 32, bottom: 24 })

        // 热门工具预览（前 6 个）
        Column() {
          Text(t('home', 'popularTools', this.locale as any))
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .fontColor('#1f1f1f')
            .width('100%')
            .padding({ left: 16, right: 16, bottom: 8 })

          ForEach(tools.slice(0, 6), (tool) => {
            ToolCard({ tool: tool, onToolTap: this.onToolTap.bind(this) })
          }, (tool) => tool.id)
        }
        .width('100%')
      }
      .width('100%')
    }
    .layoutWeight(1)
    .scrollBar(BarState.Auto)
  }

  // ─── Tools Tab（按分类）──────────────────────
  @Builder
  ToolsTab() {
    Scroll() {
      Column() {
        Text(t('home', 'toolsTitle', this.locale as any))
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor('#1f1f1f')
          .width('100%')
          .padding({ left: 16, right: 16, top: 16, bottom: 4 })

        Text(t('home', 'toolsDesc', this.locale as any))
          .fontSize(13)
          .fontColor('#767d88')
          .width('100%')
          .padding({ left: 16, right: 16, bottom: 16 })

        ForEach(categoriesWithTools(), (category) => {
          Column() {
            CategoryHeader({ category: category })

            ForEach(tools.filter(tool => tool.category === category.id), (tool) => {
              ToolCard({ tool: tool, onToolTap: this.onToolTap.bind(this) })
            }, (tool) => tool.id)
          }
          .width('100%')
          .margin({ bottom: 16 })
        }, (category) => category.id)
      }
      .width('100%')
    }
    .layoutWeight(1)
    .scrollBar(BarState.Auto)
  }

  // ─── Products Tab ────────────────────────────
  @Builder
  ProductsTab() {
    Scroll() {
      Column() {
        Text(t('products', 'title', this.locale as any))
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor('#1f1f1f')
          .width('100%')
          .padding({ left: 16, right: 16, top: 16, bottom: 4 })

        Text(t('products', 'subtitle', this.locale as any))
          .fontSize(13)
          .fontColor('#767d88')
          .width('100%')
          .padding({ left: 16, right: 16, bottom: 16 })

        ForEach(products, (product) => {
          Column() {
            ProductCard({ product: product })
          }
          .padding({ left: 16, right: 16 })
          .width('100%')
        }, (product) => product.id)
      }
      .width('100%')
    }
    .layoutWeight(1)
    .scrollBar(BarState.Auto)
  }

  // ─── About Tab ────────────────────────────────
  @Builder
  AboutTab() {
    Scroll() {
      Column() {
        Text(t('about', 'title', this.locale as any))
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor('#1f1f1f')
          .width('100%')
          .padding({ left: 16, right: 16, top: 16, bottom: 4 })

        Text(t('about', 'subtitle', this.locale as any))
          .fontSize(13)
          .fontColor('#767d88')
          .width('100%')
          .padding({ left: 16, right: 16, bottom: 8 })

        Text(t('about', 'subtitle2', this.locale as any))
          .fontSize(13)
          .fontColor('#767d88')
          .width('100%')
          .padding({ left: 16, right: 16, bottom: 24 })

        Column() {
          Text(`${t('about', 'toolsTitle', this.locale as any)} · ${tools.length}`)
            .fontSize(14)
            .fontColor('#1f1f1f')
            .margin({ bottom: 4 })

          Text(`${t('about', 'productsTitle', this.locale as any)} · ${products.length}`)
            .fontSize(14)
            .fontColor('#1f1f1f')
            .margin({ bottom: 4 })

          Text(t('about', 'free', this.locale as any))
            .fontSize(14)
            .fontColor('#fa520f')
            .fontWeight(FontWeight.Medium)
        }
        .width('100%')
        .padding(16)
        .backgroundColor('#fff0c2')
        .borderRadius(12)
        .alignItems(HorizontalAlign.Start)

        Blank().height(40)

        Text(`© 2026 ${t('footer', 'copyright', this.locale as any)}`)
          .fontSize(12)
          .fontColor('#999999')
          .width('100%')
          .textAlign(TextAlign.Center)
      }
      .width('100%')
    }
    .layoutWeight(1)
    .scrollBar(BarState.Auto)
  }

  @Builder
  tabBar(title: string, index: number) {
    Text(title)
      .fontSize(13)
      .fontColor(this.activeTab === index ? '#fa520f' : '#767d88')
      .fontWeight(this.activeTab === index ? FontWeight.Bold : FontWeight.Normal)
  }
}