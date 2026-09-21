// ─────────────────────────────────────────────────────────────────────────────
// ToolContext —— 五端唯一注入点在小程序侧的实现
//
// shared/tools/context.ts 的默认实现依赖 `globalThis.crypto.getRandomValues`，
// 小程序**没有**这个对象（微信提供的是异步的 wx.getRandomValues）。
// 所以这里必须自己注入 randomBytes，不能让默认实现接管 —— 默认实现会直接抛
// 'No secure random source available'。
//
// 契约底线（与 shared 一致）：随机源缺失时**抛错**，绝不退化成 Math.random。
// ─────────────────────────────────────────────────────────────────────────────

import Taro from '@tarojs/taro'

import { createToolContext } from 'shared/tools/context'
import type { ToolContext, ToolFetchInit } from 'shared/types/tool'

/** 预取的随机字节池：wx.getRandomValues 是异步的，而 ToolContext.randomBytes 是同步签名 */
let pool = new Uint8Array(0)

function globalCrypto(): Crypto | undefined {
  const candidate = (globalThis as { crypto?: Crypto }).crypto
  return candidate && typeof candidate.getRandomValues === 'function' ? candidate : undefined
}

/**
 * 预取随机字节。
 *
 * 微信的 `wx.getRandomValues` 只提供异步接口，而 ToolContext 的 randomBytes 是
 * 同步签名（uuid / password / random / lorem 四个工具都在同步路径里取随机数）。
 * 折中：启动时异步预取一批放进池子，同步调用从池里取。
 */
export function primeRandomPool(length = 1024): Promise<void> {
  const cryptoObj = globalCrypto()
  if (cryptoObj) {
    const buffer = new Uint8Array(length)
    cryptoObj.getRandomValues(buffer)
    pool = buffer
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    const api = (Taro as unknown as { getRandomValues?: (options: unknown) => void }).getRandomValues
    if (typeof api !== 'function') {
      // 宿主不支持 —— 保持池为空，调用时明确报错（不静默退化）
      resolve()
      return
    }
    api({
      length,
      success: (res: { randomValues?: ArrayBuffer }) => {
        if (res.randomValues) pool = new Uint8Array(res.randomValues)
        resolve()
      },
      fail: () => resolve(),
    })
  })
}

/** 同步取随机字节；池空且宿主无同步 CSPRNG 时抛错 */
function weappRandomBytes(length: number): Uint8Array {
  const cryptoObj = globalCrypto()
  if (cryptoObj) {
    const buffer = new Uint8Array(length)
    cryptoObj.getRandomValues(buffer)
    return buffer
  }

  if (pool.length >= length) {
    const slice = pool.slice(0, length)
    pool = pool.slice(length)
    return slice
  }

  throw new Error(
    '小程序随机源不可用：宿主未提供 crypto.getRandomValues，且预取池不足。' +
      '请确认基础库支持 wx.getRandomValues，并在应用启动时调用 primeRandomPool()。',
  )
}

/** 尽力取系统时区；取不到返回 undefined，交由 shared 的默认值（UTC）接管 */
function detectTimezone(): string | undefined {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone
    return typeof resolved === 'string' && resolved.length > 0 ? resolved : undefined
  } catch {
    return undefined
  }
}

/** 小程序侧 fetch 适配：wx.request → 标准 Response 形状（只满足 ToolFetchInit 的用法） */
async function fetchJson<T>(url: string, init?: ToolFetchInit): Promise<T> {
  const response = await Taro.request({
    url,
    method: (init?.method ?? 'GET') as keyof Taro.request.Method,
    header: init?.headers,
    data: init?.body,
    dataType: 'json',
  })
  return response.data as T
}

export interface WeappToolContextOptions {
  locale: string
  signal?: AbortSignal
}

export function createWeappToolContext(options: WeappToolContextOptions): ToolContext {
  // shared 的 ToolContextOverrides 不含 fetchJson（T3 才用），所以先建再补。
  const base = createToolContext({
    locale: options.locale,
    timezone: detectTimezone() ?? 'UTC',
    randomBytes: weappRandomBytes,
    signal: options.signal,
  })
  return { ...base, fetchJson }
}
