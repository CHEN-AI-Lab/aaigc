// EntryAbility —— HarmonyOS NEXT 应用入口
//
// ⚠️ 这是最小骨架，验证：
//   1. hvigor 能 build 通过
//   2. shared/ 层（types/constants/utils）能通过 ohpm 跨端引用
//   3. 没有 React/DOM 依赖泄漏进来
//
// 后续业务实现要遵守：
//   · UI 用 @Component + 声明式 ArkUI，禁止用 React 组件
//   · 端专用 hook 放 apps/harmony/entry/src/main/ets/hooks/ 下，**不**污染 shared/hooks/
//   · shared/utils/* 可直接 import，无 DOM 依赖的部分 100% 复用
//   · 路由用 @ohos.router（不是 react-navigation）

import UIAbility from '@ohos.app.ability.UIAbility'
import hilog from '@ohos.hilog'
import window from '@ohos.window'
import { initLocale } from '../store/locale'
import { setContext as setFavoritesContext } from '../store/favorites'
import { initTheme } from '../components/theme/colors'

const DOMAIN = 0x0000
const TAG = 'AAIGC_HARMONY_ENTRY'

export default class EntryAbility extends UIAbility {
  onCreate(want: object, launchParam: object): void {
    hilog.info(DOMAIN, TAG, 'EntryAbility onCreate')
    // 初始化 AppStorage（持久化 Locale + Theme）
    initLocale()
    initTheme()
    // 把 UIAbilityContext 注入 favorites store（用于 @ohos.data.preferences）
    setFavoritesContext(this.context)
  }

  onDestroy(): void {
    hilog.info(DOMAIN, TAG, 'EntryAbility onDestroy')
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    hilog.info(DOMAIN, TAG, 'EntryAbility onWindowStageCreate')
    windowStage.loadContent('pages/Index', (err: object) => {
      if (err) {
        hilog.error(DOMAIN, TAG, 'loadContent failed: %{public}s', JSON.stringify(err))
        return
      }
      hilog.info(DOMAIN, TAG, 'loadContent success')
    })
  }

  onWindowStageDestroy(): void {
    hilog.info(DOMAIN, TAG, 'EntryAbility onWindowStageDestroy')
  }

  onForeground(): void {
    hilog.info(DOMAIN, TAG, 'EntryAbility onForeground')
  }

  onBackground(): void {
    hilog.info(DOMAIN, TAG, 'EntryAbility onBackground')
  }
}