// 工具详情页 —— 展示工具信息 + 收藏 + 跳转到 web 工具页
//
// 接收路由参数 toolId（来自 Index 的 ToolCard 点击）
// 3 个操作：收藏 / 取消收藏 / 跳转到 web 版工具页

import type { ToolMeta } from 'shared/data/tools'
import type { Locale } from 'shared/types'
import { tools } from '../data/index'
import { t } from '../i18n/messages'
import { getFavorites, isFavorite, toggleFavorite } from '../store/favorites'
import { toolUrl } from '../components/web-url'

@Entry
@Component
struct ToolDetail {
  @StorageLink('aaigc_locale') locale: Locale = 'en'
  @State tool: ToolMeta | null = null
  @State private toolId: string = ''
  @State private isFavorited: boolean = false
  @State private favoriteCount: number = 0

  aboutToAppear() {
    const params = this.getUIContext().getRouter().getParams() as Record<string, string> | undefined
    if (params && params['toolId']) {
      this.toolId = params['toolId']
      const found = tools.find(item => item.id === this.toolId)
      if (found) {
        this.tool = found
      }
    }
    if (!this.tool) {
      this.tool = tools[0]
      this.toolId = this.tool.id
    }
    this.refreshFavorite()
  }

  build() {
    Column() {
      // 顶部导航条
      Row() {
        Button('‹')
          .width(36)
          .height(36)
          .backgroundColor('transparent')
          .fontColor('#1f1f1f')
          .fontSize(28)
          .onClick(() => {
            this.getUIContext().getRouter().back()
          })

        Text(this.tool?.component ?? '')
          .fontSize(18)
          .fontWeight(FontWeight.Bold)
          .fontColor('#1f1f1f')
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
          .margin({ right: 36 })
      }
      .width('100%')
      .padding({ left: 8, right: 8, top: 12, bottom: 12 })
      .backgroundColor('#fffaeb')

      // 工具详情
      if (this.tool) {
        Scroll() {
          Column() {
            // Hero：图标 + 名称
            Column() {
              Text(this.tool.icon)
                .fontSize(80)
                .margin({ bottom: 12 })

              Text(this.tool.component)
                .fontSize(24)
                .fontWeight(FontWeight.Bold)
                .fontColor('#1f1f1f')

              Text(this.tool.id)
                .fontSize(13)
                .fontColor('#767d88')
                .margin({ top: 4 })
            }
            .width('100%')
            .padding({ top: 24, bottom: 24 })
            .alignItems(HorizontalAlign.Center)

            // 元数据
            Column() {
              this.MetaRow(t('tools', 'category', this.locale), this.tool.category)
              this.MetaRow('Created', this.tool.createdAt)
              if (this.tool.npmDeps && this.tool.npmDeps.length > 0) {
                this.MetaRow('Deps', this.tool.npmDeps.join(', '))
              }
            }
            .width('100%')
            .padding(16)
            .backgroundColor('#ffffff')
            .borderRadius(12)
            .margin({ left: 16, right: 16, bottom: 16 })

            // 收藏按钮
            Button(this.isFavorited
              ? `★ ${t('ui', 'favoriteRemoved', this.locale)}`
              : `☆ ${t('ui', 'favorite', this.locale)}`)
              .width('90%')
              .height(48)
              .backgroundColor(this.isFavorited ? '#ffa110' : '#fff0c2')
              .fontColor(this.isFavorited ? '#ffffff' : '#1f1f1f')
              .fontSize(16)
              .margin({ top: 8, bottom: 8 })
              .onClick(() => this.onToggleFavorite())

            // 跳 web 版按钮
            Button(t('ui', 'run', this.locale))
              .width('90%')
              .height(48)
              .backgroundColor('#fa520f')
              .fontColor('#ffffff')
              .fontSize(16)
              .margin({ top: 8, bottom: 24 })
              .onClick(() => this.onOpenWeb())
          }
          .width('100%')
        }
        .layoutWeight(1)
        .scrollBar(BarState.Auto)
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#fffaeb')
  }

  @Builder
  MetaRow(label: string, value: string) {
    Row() {
      Text(label)
        .fontSize(13)
        .fontColor('#767d88')
        .layoutWeight(1)

      Text(value)
        .fontSize(14)
        .fontColor('#1f1f1f')
        .fontWeight(FontWeight.Medium)
    }
    .width('100%')
    .padding({ top: 6, bottom: 6 })
  }

  private async onToggleFavorite() {
    if (!this.tool) return
    const result = await toggleFavorite(this.tool.id)
    this.isFavorited = result.isFavorited
    this.favoriteCount = result.totalCount
  }

  private async refreshFavorite() {
    if (!this.tool) return
    this.isFavorited = await isFavorite(this.tool.id)
    const records = await getFavorites()
    this.favoriteCount = records.length
  }

  private onOpenWeb() {
    if (!this.tool) return
    const url = toolUrl(this.toolId, this.locale)
    // 真实调用 OpenLink 在 macOS/Windows 真机上跑；
    // 当前 WSL 环境下只在日志里打印
    console.info(`[AAIGC] open web tool: ${url}`)
    // 真实代码（注释保留，等真机验证时启用）：
    // import { OpenLinkOptions } from '@ohos.app.ability.OpenLinkOptions'
    // import { OpenLink } from '@ohos.app.ability.OpenLink'
    // OpenLink(new OpenLinkOptions(url, 'browser'))
  }
}