// ─────────────────────────────────────────────────────────────────────────────
// App 侧 ToolContext —— 时间 / 时区 / 随机源的真实注入
//
// 契约见 shared/types/tool.ts：
//   · 时间与时区取设备真实值 —— uuid / password-generator / random-generator /
//     lorem-ipsum / timestamp / date-calculator 六个工具的输出依赖它，
//     注入错了跨端结果就不一致（也是它们可测的唯一前提）。
//   · 随机源必须是 CSPRNG。**不能**依赖 shared/tools/context.ts 的默认实现：
//     它读 `globalThis.crypto.getRandomValues`，而 Hermes 不保证有 `globalThis.crypto`，
//     缺了就抛错。这里显式注入 expo-crypto（原生 CSPRNG）。
//   · T1 / T2 工具不得联网 —— 因此**不注入 fetchJson**。
//     T3 工具在 App 上走站点 API 远程执行（见 tool-runtime.ts），
//     这样"某个本该离线的工具被悄悄改成联网"在类型与运行时都不可能发生。
// ─────────────────────────────────────────────────────────────────────────────

import * as Crypto from 'expo-crypto'
import { createToolContext } from 'shared/tools'
import type { ToolContext } from 'shared/types/tool'

export interface AppToolContextOptions {
  /** BCP-47 locale（供排序 / 日期格式化，不做文案分支） */
  locale: string
  /** 省略则用设备时区；设备也拿不到时交给 shared 的默认值 */
  timezone?: string
  signal?: AbortSignal
}

/** 设备 IANA 时区；取不到返回 undefined（不静默兜底，交给 shared 决定） */
export function resolveSystemTimezone(): string | undefined {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return timeZone.length > 0 ? timeZone : undefined
  } catch {
    return undefined
  }
}

/** 原生 CSPRNG → ToolContext.randomBytes */
export function secureRandomBytes(length: number): Uint8Array {
  return Crypto.getRandomValues(new Uint8Array(length))
}

export function createAppToolContext(options: AppToolContextOptions): ToolContext {
  const timezone = options.timezone ?? resolveSystemTimezone()
  return createToolContext({
    locale: options.locale,
    ...(timezone ? { timezone } : {}),
    randomBytes: secureRandomBytes,
    ...(options.signal ? { signal: options.signal } : {}),
  })
}
