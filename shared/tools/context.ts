// ─────────────────────────────────────────────────────────────────────────────
// shared/tools/context.ts —— ToolContext 工厂（唯一注入点）
//
// 时间与随机必须由端侧经 ToolContext 注入，否则 uuid / password / random /
// lorem / timestamp / date-calculator 六个工具不可测试且跨端结果不一致。
//
// 端侧只应通过 createToolContext() 获取 ToolContext，**不要**在组件里直接调用
// Date.now() / Math.random() 后再把结果塞进参数。
//
// 本文件是注入点的唯一真源：shared/tools/index.ts 单点导出，
// shared/js/entry.ts 再 re-export（保持原有导出面不变）。
// ─────────────────────────────────────────────────────────────────────────────

import type { ToolContext } from '../types/tool'

export interface ToolContextOverrides {
  locale?: string
  timezone?: string
  now?: () => number
  randomBytes?: (length: number) => Uint8Array
  signal?: AbortSignal
}

/** 默认随机源：优先使用平台 CSPRNG，缺失时直接抛错（绝不静默退化成 Math.random） */
export function defaultRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  const cryptoObj = globalThis.crypto
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes)
    return bytes
  }
  throw new Error('No secure random source available for ToolContext.randomBytes')
}

export function createToolContext(overrides: ToolContextOverrides = {}): ToolContext {
  return {
    locale: overrides.locale ?? 'en',
    timezone: overrides.timezone ?? 'UTC',
    now: overrides.now ?? (() => Date.now()),
    randomBytes: overrides.randomBytes ?? defaultRandomBytes,
    signal: overrides.signal,
  }
}
