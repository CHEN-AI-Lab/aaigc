// 通用 UI —— 工具分类标题块
// 复用首页/工具页/分类页

import type { CategoryInfo } from 'shared/data/tools'
import { t } from '../i18n/messages'

@Component
export struct CategoryHeader {
  @Prop category: CategoryInfo
  @StorageLink('aaigc_locale') locale: string = 'en'

  build() {
    Row() {
      Text(this.category.icon)
        .fontSize(28)
        .margin({ right: 12 })

      Text(this.titleText())
        .fontSize(22)
        .fontWeight(FontWeight.Bold)
        .fontColor('#1f1f1f')
        .layoutWeight(1)
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 16, bottom: 8 })
  }

  private titleText(): string {
    // 翻译 key 约定：home.devTools / home.textTools / ...
    const ns = 'home'
    const key = this.categoryIdToKey(this.category.id)
    return t(ns, key, this.locale as any)
  }

  private categoryIdToKey(id: string): string {
    const map: Record<string, string> = {
      'ai': 'aiTools',
      'dev': 'devTools',
      'text': 'textTools',
      'security': 'securityTools',
      'convert': 'convertTools',
      'image': 'imageTools',
      'math': 'mathTools',
      'network': 'networkTools',
      'time': 'timeTools',
      'other': 'otherTools',
    }
    return map[id] ?? id
  }
}