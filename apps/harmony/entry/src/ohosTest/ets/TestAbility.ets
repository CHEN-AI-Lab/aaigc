// hypium 测试 Ability —— 注册测试套件
//
// 在 macOS/Windows 真机上由 hvigorw test 启动，
// 自动执行所有 `*.test.ets` 文件。

import UIAbility from '@ohos.app.ability.UIAbility'
import hilog from '@ohos.hilog'
import AbilityDelegatorRegistry from '@ohos.app.ability.abilityDelegatorRegistry'
import { Hypium } from '@ohos/hypium'
import tests from './tools.test.ets'

const TAG = 'AAIGC_HARMONY_TEST'
const DOMAIN = 0x0000

export default class TestAbility extends UIAbility {
  onCreate(want: object, launchParam: object): void {
    hilog.info(DOMAIN, TAG, 'TestAbility onCreate')
  }

  onWindowStageCreate(windowStage: object): void {
    hilog.info(DOMAIN, TAG, 'TestAbility onWindowStageCreate')
  }

  onForeground(): void {
    hilog.info(DOMAIN, TAG, 'TestAbility onForeground')
    // 启动测试
    const abilityDelegator = AbilityDelegatorRegistry.getAbilityDelegator()
    const abilityDelegatorArguments = AbilityDelegatorRegistry.getArguments()
    abilityDelegator.executeShellCommand('aa force-stop', () => {})

    Hypium.hypiumTest(abilityDelegator, abilityDelegatorArguments, tests)
  }
}