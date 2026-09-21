// ─────────────────────────────────────────────────────────────────────────────
// App 侧登录 —— 两条 Bearer 通道，全部复用 shared 的契约与校验
//
//   通道 A：密码授权   POST /api/auth/token  { grantType:'password', email, password, clientId }
//   通道 B：设备码授权 POST /api/auth/device/code + /api/auth/device/token（RFC 8628 风格）
//
// 关于"邮箱验证码登录"（通道 C）：
// 服务端 /api/auth/send-verification 原先走裸 `isSameOrigin(req)`，原生端既无 Origin 也无
// Referer → 恒 403。已于 2026-09-21 修好：改用 `isTrustedPreAuthRequest(req)`——
//   浏览器：仍校验同源（Web 行为不变）；
//   原生端：须在请求头带 `x-aaigc-client-id`，且该 clientId 在服务端 `AAIGC_CLIENT_IDS` 白名单内。
// 若服务端未配置该白名单，原生端仍无法调用（安全默认值：未配置即不放行）。
// 此时没有密码的账号请走设备码通道（在浏览器里用任意方式登录后确认）。
//
// 设备码通道还有一个好处：App 全程不接触用户密码，也不必内嵌 WebView 做 OAuth。
// ─────────────────────────────────────────────────────────────────────────────

import type { ApiClient } from 'shared/api/http-client'
import { ApiError } from 'shared/api/http-client'
import type { DeviceCodeResponse, TokenPair } from 'shared/types/api'
import {
  deviceCodeRequestSchema,
  deviceTokenRequestSchema,
  parseOrFail,
  tokenRequestSchema,
} from 'shared/validators/api'

/** 服务端 expiresIn = 600s；这里再兜一层，防止异常取值把界面挂死 */
const MAX_WAIT_MS = 15 * 60 * 1000

/** 遇到 429（轮询过快）时的退避上限 */
const MAX_INTERVAL_MS = 30_000

/** 密码授权：一次调用直接换到 TokenPair */
export async function loginWithPassword(
  client: ApiClient,
  params: { email: string; password: string; clientId: string },
): Promise<TokenPair> {
  const parsed = parseOrFail(tokenRequestSchema, {
    grantType: 'password',
    email: params.email,
    password: params.password,
    clientId: params.clientId,
  })
  if (!parsed.ok) throw new ApiError('invalidParams', 0)

  return client.post<TokenPair>('/api/auth/token', parsed.data)
}

export interface DeviceCodePrompt {
  /** 展示形态 XXXX-XXXX，由服务端格式化 */
  userCode: string
  /** 可能是**空串** = 站点基址未配置。此时必须原样提示"服务未配置"，不得自己拼 URL */
  verificationUri: string
  expiresIn: number
}

export interface DeviceFlowOptions {
  client: ApiClient
  clientId: string
  /** 拿到用户码后立刻回调，界面据此渲染"请到 xx 输入 yyyy" */
  onPrompt: (prompt: DeviceCodePrompt) => void
  /** 每轮轮询的心跳，用于界面显示"等待确认中 Ns" */
  onWaiting?: (elapsedMs: number) => void
  /** 注入点：单测可替换时间与 sleep */
  now?: () => number
  sleep?: (ms: number) => Promise<void>
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * 设备码授权。成功返回 TokenPair；用户一直不确认则抛 ApiError('deviceCodeExpired')。
 *
 * 与 apps/cli/src/core/device-flow.ts 同一套语义（该实现无法跨 app 复用，
 * 因为它是 CLI 进程内的 IO 适配层；协议部分——校验、错误码分支——两边都取自 shared）。
 */
export async function loginWithDeviceCode(options: DeviceFlowOptions): Promise<TokenPair> {
  const now = options.now ?? ((): number => Date.now())
  const sleep = options.sleep ?? defaultSleep
  const { client } = options

  const codeRequest = parseOrFail(deviceCodeRequestSchema, { clientId: options.clientId })
  if (!codeRequest.ok) throw new ApiError('invalidClientId', 0)

  const device = await client.post<DeviceCodeResponse>('/api/auth/device/code', codeRequest.data)
  options.onPrompt({
    userCode: device.userCode,
    verificationUri: device.verificationUri,
    expiresIn: device.expiresIn,
  })

  const tokenRequest = parseOrFail(deviceTokenRequestSchema, { deviceCode: device.deviceCode })
  if (!tokenRequest.ok) throw new ApiError('invalidParams', 0)

  const deadline = now() + Math.min(device.expiresIn * 1000, MAX_WAIT_MS)
  const startedAt = now()
  let intervalMs = Math.max(1, device.interval) * 1000

  for (;;) {
    if (now() >= deadline) throw new ApiError('deviceCodeExpired', 410)

    await sleep(intervalMs)

    if (now() >= deadline) throw new ApiError('deviceCodeExpired', 410)
    options.onWaiting?.(now() - startedAt)

    try {
      return await client.post<TokenPair>('/api/auth/device/token', tokenRequest.data)
    } catch (error) {
      if (error instanceof ApiError) {
        // 用户还没在浏览器确认 —— 正常状态，继续轮询
        if (error.code === 'authorizationPending') continue
        // 轮询过快（服务端 60 次/分钟/IP）：指数退避后继续，不直接失败
        if (error.code === 'tooManyRequests') {
          intervalMs = Math.min(intervalMs * 2, MAX_INTERVAL_MS)
          continue
        }
      }
      throw error
    }
  }
}
