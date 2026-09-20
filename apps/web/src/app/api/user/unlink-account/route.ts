// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/unlink-account —— 解绑第三方登录方式 / 密码
//
// 鉴权：resolveAuthResult（Bearer 优先，回退 cookie；失败码 tokenExpired/tokenInvalid 能下发到客户端）
// CSRF：Bearer 豁免同源，cookie 沿用既有校验。
//
// 第三方 revoke 端点来自 OAUTH_REVOKE_ENDPOINTS_JSON（T02.4 已 env 化，无硬编码域名）：
//   · 未配置该 provider 的端点 → 跳过远端 revoke，本地解绑照常完成（不报错）
//   · 已配置但调用失败      → 同样继续，最坏情况是对方留着过期授权
// 解绑成功与否不取决于远端端点是否配置——revoke 只是「让对方 token 立刻失效」的增强动作。
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { resolveAuthResult } from '@/auth-guard'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'
import { checkRateLimit } from 'shared/utils/rate-limit'
import { isTrustedRequest } from 'shared/utils/csrf'
import { oauthRevokeEndpoints } from 'shared/constants/endpoints'

// 合法的可解绑 provider 白名单
const VALID_PROVIDERS = new Set(['google', 'github', 'password'])

export const POST = withCors(async (req: NextRequest) => {
  const authResult = await resolveAuthResult(req)
  if (!authResult.ok) return errorResponse(authResult.code)

  if (!isTrustedRequest(req, authResult.mode)) {
    return errorResponse('forbidden')
  }

  // 限流：每用户每分钟 5 次解绑操作（既有行为不变）
  const rl = await checkRateLimit(`unlink:${authResult.session.user.id}`, 5, 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl.resetAt)

  const userId = authResult.session.user.id

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse('invalidJson')
  }

  const provider = (body as Record<string, unknown> | null)?.provider
  if (!provider || typeof provider !== 'string' || !VALID_PROVIDERS.has(provider)) {
    return errorResponse('invalidProvider')
  }

  // 邮箱验证码登录永远不可解绑——保底方式
  if (provider === 'email' || provider === 'credentials') {
    return errorResponse('cannotUnlinkEmail')
  }

  // 拿到当前用户所有绑定方式和密码状态
  const [accounts, user] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      select: { id: true, provider: true, refresh_token: true, access_token: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } }),
  ])

  const hasPassword = !!user?.passwordHash
  const oauthAccounts = accounts.filter((a) => !['email', 'credentials'].includes(a.provider))

  if (provider === 'password') {
    if (!hasPassword) {
      return errorResponse('notSet')
    }
    // 解绑密码前必须还有其他登录方式
    if (oauthAccounts.length === 0) {
      return errorResponse('mustKeepOneMethod')
    }
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: null } })
    return NextResponse.json({ ok: true })
  }

  // OAuth 解绑
  const account = accounts.find((a) => a.provider === provider)
  if (!account) {
    return errorResponse('notFound')
  }

  // 解绑后必须还有 ≥1 种登录方式
  const remainingOauth = oauthAccounts.filter((a) => a.provider !== provider)
  if (remainingOauth.length === 0 && !hasPassword) {
    return errorResponse('mustKeepOneMethod')
  }

  // 远端 revoke：让对方 token 立刻失效。端点未配置（如 GitHub 没有服务端解绑 API）
  // 或调用失败都只跳过这一步，本地解绑照常完成。
  const revokeEndpoint = oauthRevokeEndpoints()[provider]
  if (revokeEndpoint) {
    const token = account.refresh_token || account.access_token
    if (token) {
      try {
        await fetch(revokeEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `token=${encodeURIComponent(token)}`,
        })
      } catch {
        // revoke 失败也继续——最坏情况是对方留着过期授权
      }
    }
  }

  await prisma.account.delete({ where: { id: account.id } })

  // 告诉前端这个 provider 是否需要用户手动去取消授权
  const needsManualRevoke = provider === 'github'

  return NextResponse.json({ ok: true, needsManualRevoke })
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
