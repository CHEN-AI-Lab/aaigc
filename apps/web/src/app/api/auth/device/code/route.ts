// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/device/code —— device flow 发起（架构 §4.2.1；CLI / 桌面端）
//
//   body: { clientId } → { deviceCode, userCode, verificationUri, expiresIn, interval }
//
// 设备码给设备轮询（/api/auth/device/token），用户码给用户在浏览器里核对
// （/api/auth/device/approve，需已登录会话）。
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'
import {
  DEVICE_CODE_INTERVAL_SECONDS,
  DEVICE_CODE_TTL_SECONDS,
  deviceVerificationUri,
  formatUserCode,
  generateUserCode,
  randomToken,
} from '@/device-flow'
import { checkRateLimit } from 'shared/utils/rate-limit'
import { getTrustedClientIp } from 'shared/utils/ip'
import type { DeviceCodeResponse } from 'shared/types/api'

/** userCode 有 @unique 约束，碰撞概率极低但要兜住 */
const MAX_USER_CODE_ATTEMPTS = 5

export const POST = withCors(async (req: NextRequest) => {
  const ip = getTrustedClientIp(req)
  const rl = await checkRateLimit(`device-code:${ip}`, 10, 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl.resetAt)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse('invalidJson')
  }

  const clientId = (body as Record<string, unknown> | null)?.clientId
  if (typeof clientId !== 'string' || clientId.trim().length === 0) {
    return errorResponse('missingClientId')
  }

  const deviceCode = randomToken(32)
  const expiresAt = new Date(Date.now() + DEVICE_CODE_TTL_SECONDS * 1000)

  let userCode = ''
  for (let attempt = 0; attempt < MAX_USER_CODE_ATTEMPTS; attempt++) {
    const candidate = generateUserCode()
    try {
      await prisma.deviceCode.create({
        data: { deviceCode, userCode: candidate, clientId: clientId.trim(), expiresAt },
      })
      userCode = candidate
      break
    } catch {
      // 唯一约束冲突（userCode 或 deviceCode）→ 重新生成用户码再试
    }
  }

  if (!userCode) {
    return errorResponse('requestFailed')
  }

  const response: DeviceCodeResponse = {
    deviceCode,
    userCode: formatUserCode(userCode),
    // 可能是空串（站点基址未配置）。客户端必须原样提示「服务未配置」，
    // **不得**自己拿公开站域名拼 URL：那个站点并不持有本次签发的 device_code。
    // 详见 device-flow.ts 的 TODO(T05)。
    verificationUri: deviceVerificationUri(),
    expiresIn: DEVICE_CODE_TTL_SECONDS,
    interval: DEVICE_CODE_INTERVAL_SECONDS,
  }
  return NextResponse.json(response)
})
