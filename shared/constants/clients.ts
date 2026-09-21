// ─────────────────────────────────────────────────────────────────────────────
// 第一方客户端白名单（clientId 列表）
//
// 为什么需要它：
// 有两类 API 端点**在登录之前**就要被调用（发邮箱验证码、注册、校验邮箱）。这些端点
// 拿不到 Bearer token，因此无法用 `isTrustedRequest(req, 'bearer')` 判定通道；
// 而原生端（App / CLI / 桌面端）发 fetch 时不带 `Origin` 头，会被 `isSameOrigin` 判为
// CSRF 并 403 —— 导致原生端**无法注册、无法用邮箱验证码登录**，但 Web 端完全正常。
//
// 放行条件（而非"无 Origin 就放行"）：请求必须携带一个**在白名单内**的 clientId。
// 这样即便策略被滥用，也只有我们自己的客户端能触发发信，而不是任意第三方站点。
//
// 安全默认值：**未配置白名单 → 列表为空 → 一律不放行**（保持现状的严格行为。
// ─────────────────────────────────────────────────────────────────────────────

import { parseList, readEnv } from './env'

/** 客户端标识请求头。与 `Authorization` 正交，仅用于未登录端点的第一方识别。 */
export const CLIENT_ID_HEADER = 'x-aaigc-client-id'

/**
 * 允许调用「未登录端点」的客户端 clientId 列表。
 * 环境变量：AAIGC_CLIENT_IDS（逗号分隔）
 */
export function nativeClientIds(): string[] {
  return parseList(readEnv('AAIGC_CLIENT_IDS'))
}

/**
 * 请求携带的 clientId（未携带或为空 → null。
 *
 * ⚠️ 这只是**第一方识别**，不是鉴权。绝不能单独用它放行任何敏感操作。
 *
 * 配合下面「按邮箱限流」使用：即便 clientId 被伪造，针对单个邮箱的发信量仍受限。
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function requestClientId(headers: Headers): string | null {
  const value = headers.get(CLIENT_ID_HEADER)
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
