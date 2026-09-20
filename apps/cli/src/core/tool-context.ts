// ─────────────────────────────────────────────────────────────────────────────
// CLI 侧 ToolContext —— 时间 / 时区 / 随机源 / 网络 的真实注入
//
// 契约见 shared/types/tool.ts：T1/T2 工具**不得**使用 fetchJson，因此这里只在
// tier === 'T3' 时注入，避免把「本应离线的工具」悄悄变成联网工具。
// 时间与时区取本机真实值：uuid / password / random / lorem / timestamp /
// date-calculator 六个工具的输出依赖它，注入错了跨端结果就不一致。
// ─────────────────────────────────────────────────────────────────────────────

import { createToolContext } from 'shared/tools'
import type { ToolContext, ToolFetchInit, ToolTier } from 'shared/types/tool'

export interface CliToolContextOptions {
  /** BCP-47 locale（供排序 / 日期格式化，不做文案分支） */
  locale: string
  tier: ToolTier
  /** 省略则用本机时区；本机也拿不到时交给 shared 的默认值 */
  timezone?: string
}

/** 本机 IANA 时区；取不到返回 undefined（不做静默兜底，交给 shared 决定） */
export function resolveSystemTimezone(): string | undefined {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return timeZone && timeZone.length > 0 ? timeZone : undefined
  } catch {
    return undefined
  }
}

async function fetchJson<T>(url: string, init?: ToolFetchInit): Promise<T> {
  const response = await fetch(url, {
    ...(init?.method ? { method: init.method } : {}),
    ...(init?.headers ? { headers: init.headers } : {}),
    ...(init?.body !== undefined ? { body: init.body } : {}),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`)
  }
  return (await response.json()) as T
}

export function createCliToolContext(options: CliToolContextOptions): ToolContext {
  const timezone = options.timezone ?? resolveSystemTimezone()
  const base = createToolContext({
    locale: options.locale,
    ...(timezone ? { timezone } : {}),
  })
  if (options.tier !== 'T3') return base
  return { ...base, fetchJson }
}
