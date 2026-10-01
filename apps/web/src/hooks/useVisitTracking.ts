'use client'

import { useEffect } from 'react'
// 仅 web 端使用的埋点 hook —— 依赖 web 侧的 NEXT_PUBLIC_VERCEL_ENV 与
// localStorage/crypto/navigator 等浏览器 API，故放在 apps/web/src/hooks/
// 而非 shared/hooks/。其他端的埋点接入各自端内置的实现。
import { WORKER_URL, FALLBACK_URL } from 'shared/constants'

// Environment is exposed via next.config.ts env (maps VERCEL_ENV → NEXT_PUBLIC_VERCEL_ENV)
const ENV =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VERCEL_ENV) || 'development'

// 设备 UUID：localStorage 存一次，不清理就不变
function getDeviceId(): string {
  let id: string | null = null
  if (typeof window !== 'undefined') {
    id = localStorage.getItem('_did')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('_did', id)
    }
  }
  return id || 'unknown'
}

export function useVisitTracking(project: string, page?: string | null, tool?: string, userId?: string | null) {
  useEffect(() => {
    const payload = JSON.stringify({
      project,
      page: page === null ? undefined : page || window.location.pathname,
      tool: tool || null,
      type: tool ? 'tool' : 'page',
      env: ENV,
      platform: 'web',
      deviceId: getDeviceId(),
      ...(userId ? { userId } : {}),
    })

    // Try Worker first (foreign users), fallback to insights API (Chinese users)
    const track = async () => {
      try {
        await fetch(`${WORKER_URL}/track`, {
          method: 'POST',
          body: payload,
          signal: AbortSignal.timeout(3000),
        })
      } catch {
        navigator.sendBeacon(FALLBACK_URL, payload)
      }
    }
    track()
  }, [project, page, tool, userId])
}