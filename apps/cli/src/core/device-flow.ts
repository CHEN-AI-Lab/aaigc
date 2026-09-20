// ─────────────────────────────────────────────────────────────────────────────
// device flow（RFC 8628 风格）—— CLI 没有浏览器，不能走 OAuth 回调
//
// 与 apps/web 三个 route 的真实契约（以代码为准，见交付报告）：
//
//   POST /api/auth/device/code      body { clientId }
//        → 200 { deviceCode, userCode, verificationUri, expiresIn, interval }
//        · userCode 已是展示形态 XXXX-XXXX（服务端 formatUserCode）
//        · verificationUri 可能是**空串**（NEXT_PUBLIC_APP_URL 未配置）。
//          契约明确要求客户端原样提示「服务未配置」，**不得**自己拼 URL：
//          拼出来的站点并不认识这个 device_code。
//
//   POST /api/auth/device/token     body { deviceCode }
//        → 200 TokenPair
//        → 409 authorizationPending  未确认，按 interval 继续轮询
//        → 409 deviceCodeConsumed    已被兑换 / 已被他人确认
//        → 410 deviceCodeExpired     已过期
//        → 404 deviceCodeNotFound    不存在
//        → 429 tooManyRequests       轮询过快（服务端 60 次/分钟/IP）
//
//   POST /api/auth/device/approve   body { userCode }（需已登录会话）
//        ← 这一步由用户在浏览器完成，CLI 不参与，也没有对应命令。
// ─────────────────────────────────────────────────────────────────────────────

import type { ApiClient } from 'shared/api/http-client'
import { ApiError } from 'shared/api/http-client'
import type { DeviceCodeResponse, TokenPair } from 'shared/types/api'
import {
  deviceCodeRequestSchema,
  deviceTokenRequestSchema,
  parseOrFail,
} from 'shared/validators/api'
import { failureError } from './errors'
import type { Io } from './io'
import type { Translator } from './i18n'

/** 服务端 expiresIn = 600s；这里再兜一层，防止异常取值把进程挂死 */
const MAX_WAIT_MS = 15 * 60 * 1000

/** 遇到 429 时的退避上限 */
const MAX_INTERVAL_MS = 30_000

export interface DeviceFlowDeps {
  /** 未登录状态下的客户端（tokenStore 会返回 null） */
  client: ApiClient
  clientId: string
  io: Io
  translator: Translator
  /** 注入点：单测可替换时间与 sleep */
  now?: () => number
  sleep?: (ms: number) => Promise<void>
}

export interface DeviceFlowResult {
  pair: TokenPair
  device: DeviceCodeResponse
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * 展示授权提示。
 * `--json` 下 stdout 只能有最终结果，故提示改走 stderr（人仍然看得到）。
 */
function emitPrompt(deps: DeviceFlowDeps, device: DeviceCodeResponse): void {
  const { io, translator } = deps
  const hasUri = device.verificationUri.length > 0
  const uriLine = hasUri ? translator.c('loginOpenUrl') : translator.c('loginNoVerificationUri')
  const codeLine = `${translator.c('loginUserCodeLabel')}: ${device.userCode}`

  if (io.json) {
    io.diag(uriLine)
    if (hasUri) io.diag(device.verificationUri)
    io.diag(codeLine)
    return
  }

  const lines = [uriLine]
  if (hasUri) lines.push(`  ${io.accent(device.verificationUri)}`)
  lines.push('', `${translator.c('loginUserCodeLabel')}: ${io.accent(device.userCode)}`)
  io.write(lines.join('\n'))
}

export async function runDeviceFlow(deps: DeviceFlowDeps): Promise<DeviceFlowResult> {
  const now = deps.now ?? ((): number => Date.now())
  const sleep = deps.sleep ?? defaultSleep
  const { io, translator, client } = deps

  const request = parseOrFail(deviceCodeRequestSchema, { clientId: deps.clientId })
  if (!request.ok) {
    // 只可能是 clientId 形态不合规（本地生成，正常不该发生）
    throw failureError('invalidParams', undefined, 'clientId rejected by shared validator')
  }

  io.diag(translator.c('loginRequesting'))
  const device = await client.post<DeviceCodeResponse>('/api/auth/device/code', request.data)
  emitPrompt(deps, device)

  const tokenRequest = parseOrFail(deviceTokenRequestSchema, { deviceCode: device.deviceCode })
  if (!tokenRequest.ok) {
    throw failureError('invalidParams', undefined, 'deviceCode rejected by shared validator')
  }

  const deadline = now() + Math.min(device.expiresIn * 1000, MAX_WAIT_MS)
  let intervalMs = Math.max(1, device.interval) * 1000
  const startedAt = now()
  const waiting = (): string => translator.c('loginWaiting')

  if (io.stderrIsTty) {
    io.progress(waiting())
  } else {
    // 非 TTY 下没有进度行，至少留一行说明「在等」，否则看起来像卡住
    io.diag(waiting())
  }

  for (;;) {
    if (now() >= deadline) {
      io.clearProgress()
      throw failureError('deviceCodeExpired', undefined, translator.c('loginRetryHint'))
    }

    await sleep(intervalMs)

    if (now() >= deadline) {
      io.clearProgress()
      throw failureError('deviceCodeExpired', undefined, translator.c('loginRetryHint'))
    }

    io.progress(`${waiting()} ${Math.floor((now() - startedAt) / 1000)}s`)

    try {
      const pair = await client.post<TokenPair>('/api/auth/device/token', tokenRequest.data)
      io.clearProgress()
      return { pair, device }
    } catch (error) {
      if (error instanceof ApiError) {
        // 用户还没在浏览器确认 —— 正常状态，继续轮询
        if (error.code === 'authorizationPending') continue
        // 轮询过快（服务端限流）：指数退避后继续，不直接失败
        if (error.code === 'tooManyRequests') {
          intervalMs = Math.min(intervalMs * 2, MAX_INTERVAL_MS)
          continue
        }
      }
      io.clearProgress()
      throw error
    }
  }
}
