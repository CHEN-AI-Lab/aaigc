// ─────────────────────────────────────────────────────────────────────────────
// 双通道鉴权解析（架构 §4.2.2 / A3）
//
//   cookie 通道：NextAuth `auth()` 读会话 cookie —— Web 现有行为，一行不变
//   bearer 通道：`Authorization: Bearer <JWT>` —— 小程序 / App / 桌面 / CLI
//
// 放在 apps/web 而非 shared：解析 cookie 通道需要 next-auth，shared 不得依赖它。
//
// 迁移成本设计：返回的是 **NextAuth session 同形状**的对象，
// 每个业务路由只需把 `await auth()` 换成 `await resolveAuthResult(req)`，
// 其余 `session.user.id` / `session.user.email` 读取代码零改动。
// ─────────────────────────────────────────────────────────────────────────────

import { auth } from '@/auth'
import { readBearerToken } from 'shared/utils/csrf'
import {
  decodeAccessToken,
  isAccessTokenExpired,
  verifyAccessToken,
} from 'shared/utils/auth-token'
import type { VerifiedAccessToken } from 'shared/utils/auth-token'
import type { AuthMode } from 'shared/types/api'

/** 与 NextAuth Session 的消费面保持同形状（业务路由只读 id / email / name / role） */
export interface GuardSession {
  user: {
    id: string
    email: string | null
    name: string | null
    role: string
  }
}

export interface ResolvedAuth {
  session: GuardSession
  mode: AuthMode
}

/**
 * 鉴权失败时下发的错误码（三者**一律 401**，绝不冒泡成 500）。
 *
 *   · `loginRequired` —— 压根没带凭证（既无 Authorization，也无有效 cookie）
 *   · `tokenExpired`  —— 带了 Bearer，`exp` 已过：客户端 refresh 后重试即可
 *   · `tokenInvalid`  —— 带了 Bearer，但签名不对 / 结构非法 / 缺 exp 或 sub：
 *                        重试没用，必须丢弃凭证重新登录
 *
 * 区分后两种的意义：客户端（`shared/api/http-client.ts`）据此决定
 * 「refresh 后重试一次」还是「直接抛给调用方」，避免坏 token 被无限重试。
 */
export type AuthFailureCode = 'loginRequired' | 'tokenInvalid' | 'tokenExpired'

/** 带失败原因的解析结果；需要区分 token 失败原因的路由请用 `resolveAuthResult()` */
export type AuthResult =
  | { ok: true; session: GuardSession; mode: AuthMode }
  | { ok: false; code: AuthFailureCode }

/** Bearer 分支的解析结果：成功给 session，失败给错误码 */
type BearerResult = GuardSession | AuthFailureCode

function sessionFromVerified(verified: VerifiedAccessToken): GuardSession {
  return {
    user: {
      id: verified.userId,
      email: verified.email,
      name: null,
      role: verified.role,
    },
  }
}

/**
 * 解析 Bearer 通道。
 *
 * 判定顺序（**先分类、后验签**）：
 *   1. 结构非法（不是三段 JWT / payload 非 JSON）→ `tokenInvalid`
 *   2. 缺 `exp` → `tokenInvalid`（本项目的签发方恒写 exp，缺了就是外来/伪造 token）
 *   3. `exp` 已过 → `tokenExpired`
 *   4. 验签失败（签名不对 / 密钥未配置 / 缺 sub）→ `tokenInvalid`
 *
 * 第 2、3 步在验签**之前**：过期是客户端唯一能自救（refresh）的情况，
 * 优先识别它，避免"过期 + 密钥轮换导致验签也失败"时被误判成 tokenInvalid 而丢弃凭证。
 * 未验签的信息只用于错误分类，授权一律以第 4 步的验签结果为准。
 */
async function resolveBearerToken(token: string): Promise<BearerResult> {
  const decoded = decodeAccessToken(token)
  if (!decoded) return 'tokenInvalid'
  if (typeof decoded.exp !== 'number') return 'tokenInvalid'
  if (isAccessTokenExpired(decoded)) return 'tokenExpired'

  try {
    const verified = await verifyAccessToken(token)
    if (!verified) return 'tokenInvalid'
    return sessionFromVerified(verified)
  } catch {
    // 密钥未配置等服务端异常：按「token 不可用」处理，绝不冒泡成 500
    return 'tokenInvalid'
  }
}

/**
 * 解析请求的鉴权身份（**首选入口**：能区分失败原因）。
 *
 * 顺序（与架构 §4.2.2 一致）：
 *   1. 有 `Authorization: Bearer` → 校验 JWT。失败 → `{ ok: false, code }`，
 *      **不降级到 cookie**，避免"带着坏 token 却因浏览器恰好有 cookie 而通过"这种隐式混淆。
 *   2. 无 Authorization 头 → NextAuth cookie session；没有会话 → `loginRequired`。
 *
 * Web 永远不发 Authorization 头 → 恒走第 2 步，行为 100% 不变。
 */
export async function resolveAuthResult(req: Request): Promise<AuthResult> {
  const bearer = readBearerToken(req)
  if (bearer) {
    const resolved = await resolveBearerToken(bearer)
    if (typeof resolved === 'string') return { ok: false, code: resolved }
    return { ok: true, session: resolved, mode: 'bearer' }
  }

  const session = await auth()
  if (session?.user?.id) {
    return {
      ok: true,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email ?? null,
          name: session.user.name ?? null,
          role: session.user.role,
        },
      },
      mode: 'cookie',
    }
  }

  return { ok: false, code: 'loginRequired' }
}

/**
 * 解析请求的鉴权身份（兼容入口：只要"是不是通过了"）。
 *
 * 与 `resolveAuthResult()` 同一套逻辑，只是把失败原因折叠成 null。
 * 新代码请用 `resolveAuthResult()`，让 `tokenExpired` / `tokenInvalid` 能下发到客户端。
 */
export async function resolveAuth(req: Request): Promise<ResolvedAuth | null> {
  const result = await resolveAuthResult(req)
  return result.ok ? { session: result.session, mode: result.mode } : null
}

/** 业务路由的唯一入口：返回 session 形状对象或 null */
export async function getSessionOrToken(req: Request): Promise<GuardSession | null> {
  const resolved = await resolveAuth(req)
  return resolved ? resolved.session : null
}
