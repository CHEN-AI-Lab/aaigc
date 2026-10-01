// 通用 UI —— 产品卡片（图标 + 名称 + 状态标签）

import type { Product } from 'shared/types'
import { t } from '../i18n/messages'

@Component
export struct ProductCard {
  @Prop product: Product
  @StorageLink('aaigc_locale') locale: string = 'en'

  build() {
    Column() {
      Row() {
        Text(this.product.icon)
          .fontSize(36)

        Blank()

        if (this.product.status === 'live') {
          Text(t('common', 'live', this.locale as any))
            .fontSize(11)
            .fontColor('#ffffff')
            .backgroundColor('#22c55e')
            .padding({ left: 8, right: 8, top: 2, bottom: 2 })
            .borderRadius(10)
        } else if (this.product.status === 'wip') {
          Text(t('common', 'comingSoon', this.locale as any))
            .fontSize(11)
            .fontColor('#767d88')
            .backgroundColor('#fff0c2')
            .padding({ left: 8, right: 8, top: 2, bottom: 2 })
            .borderRadius(10)
        }
      }
      .width('100%')
      .margin({ bottom: 8 })

      Text(this.productName())
        .fontSize(16)
        .fontWeight(FontWeight.Bold)
        .fontColor('#1f1f1f')
        .width('100%')
        .textAlign(TextAlign.Start)

      Text(t(`products.${this.product.id}`, 'tag', this.locale as any))
        .fontSize(13)
        .fontColor('#fa520f')
        .margin({ top: 4 })
        .width('100%')
    }
    .width('100%')
    .padding(16)
    .backgroundColor('#ffffff')
    .borderRadius(12)
    .margin({ bottom: 12 })
    .alignItems(HorizontalAlign.Start)
  }

  private productName(): string {
    return t(`products.${this.product.id}`, 'name', this.locale as any)
  }
}