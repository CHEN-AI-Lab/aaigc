// 通用 UI —— 工具卡片（图标 + 名称 + 描述）
//
// 通过 onToolTap 回调让父组件（Index / ToolDetail）决定路由跳转。

import type { ToolMeta } from 'shared/data/tools'

@Component
export struct ToolCard {
  @Prop tool: ToolMeta
  @Prop showCategory: boolean = false
  @Prop showChevron: boolean = true
  onToolTap: (tool: ToolMeta) => void = () => {}

  build() {
    Row() {
      Text(this.tool.icon)
        .fontSize(32)
        .margin({ right: 12 })

      Column() {
        Text(this.tool.component)
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor('#1f1f1f')

        Text(this.tool.id)
          .fontSize(12)
          .fontColor('#767d88')
          .margin({ top: 2 })

        if (this.showCategory) {
          Text(this.tool.category)
            .fontSize(11)
            .fontColor('#fa520f')
            .margin({ top: 2 })
        }
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      if (this.showChevron) {
        Text('›')
          .fontSize(24)
          .fontColor('#767d88')
      }
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 12, bottom: 12 })
    .backgroundColor('#ffffff')
    .borderRadius(12)
    .margin({ left: 16, right: 16, bottom: 8 })
    .onClick(() => this.onToolTap(this.tool))
  }
}