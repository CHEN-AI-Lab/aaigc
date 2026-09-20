// ─────────────────────────────────────────────────────────────────────────────
// TokenPair 签发（架构 §4.2.1 / Q-A5）
//
// access  = JWT，无状态，15 分钟，Edge 可验
// refresh = 随机 32 字节，只存 SHA-256 hash 于 RefreshToken 表，30 天，可撤销
//
// 三处调用：POST /api/auth/token、/api/auth/token/refresh（rotation）、
//          /api/auth/device/token（device flow 兑换）
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from 'shared/utils/prisma'
import {
  generateRefreshToken,
  isoFromMs,
  refreshTokenExpiry,
  signAccessToken,
} from 'shared/utils/auth-token'
import type { TokenPair, UserBrief } from 'shared/types/api'

export interface IssueTokenPairParams {
  user: UserBrief
  clientId: string
  /** 传入即沿用该 token 家族（refresh rotation）；省略则开新族 */
  familyId?: string
}

export async function issueTokenPair(params: IssueTokenPairParams): Promise<TokenPair> {
  const { user, clientId } = params
  const access = await signAccessToken({ userId: user.id, email: user.email, role: user.role })
  const { token: refreshToken, tokenHash } = await generateRefreshToken()

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      familyId: params.familyId ?? globalThis.crypto.randomUUID(),
      clientId,
      expiresAt: refreshTokenExpiry(),
    },
  })

  return {
    accessToken: access.token,
    refreshToken,
    tokenType: 'Bearer',
    expiresAt: isoFromMs(access.expiresAtMs),
    user,
  }
}
