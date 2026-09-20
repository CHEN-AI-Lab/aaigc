// ─────────────────────────────────────────────────────────────────────────────
// 埋点上报 —— 非 React 环境（CLI / 小程序 / 桌面）与 React 环境共用同一负载格式（SK-6）
// 端点来自 NEXT_PUBLIC_WORKER_URL / NEXT_PUBLIC_FALLBACK_URL（无硬编码，无 fallback）。
// ─────────────────────────────────────────────────────────────────────────────

import { WORKER_URL, FALLBACK_URL } from '../constants'
import { DEFAULT_PROJECT_ID } from '../constants/projects'
import type { Platform, ProjectId, TrackPayload } from '../types/api'

export interface TrackOptions {
  project?: ProjectId
  platform: Platform
  page?: string
  tool?: string
  env?: string
  deviceId: string
  userId?: string
  locale?: string
  /** 显式关闭时不发任何请求（CLI / 桌面默认关闭，Q10） */
  enabled?: boolean
  fetchImpl?: typeof fetch
}

function readEnv(name: string): string {
  return typeof process !== 'undefined' && process.env ? (process.env[name] ?? '') : ''
}

function detectEnv(): string {
  const explicit = readEnv('NEXT_PUBLIC_VERCEL_ENV')
  if (explicit) return explicit
  const nodeEnv = readEnv('NODE_ENV')
  return nodeEnv ? nodeEnv : 'development'
}

export function buildTrackPayload(options: TrackOptions): TrackPayload {
  return {
    project: options.project ?? DEFAULT_PROJECT_ID,
    platform: options.platform,
    page: options.page,
    tool: options.tool,
    type: options.tool ? 'tool' : 'page',
    env: options.env ?? detectEnv(),
    deviceId: options.deviceId,
    ...(options.userId ? { userId: options.userId } : {}),
    ...(options.locale ? { locale: options.locale as TrackPayload['locale'] } : {}),
  }
}

/**
 * 上报埋点。失败静默（埋点不得影响业务）。
 * 未配置端点时直接返回 false。
 */
export async function track(options: TrackOptions): Promise<boolean> {
  if (options.enabled === false) return false
  const primary = WORKER_URL
  const fallback = FALLBACK_URL
  if (!primary && !fallback) return false

  const payload = JSON.stringify(buildTrackPayload(options))
  const doFetch = options.fetchImpl ?? (typeof fetch === 'function' ? fetch : null)
  if (!doFetch) return false

  for (const base of [primary, fallback]) {
    if (!base) continue
    try {
      const response = await doFetch(`${base}/track`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
      })
      if (response.ok) return true
    } catch {
      // 继续尝试 fallback
    }
  }
  return false
}
