// 验证码校验与原子消费
// 统一所有消费点（auth 登录、register、verify-email、set-password、user/delete），
// 保证：用途绑定（purpose）、失败计数（attempts）、并发安全的消费（updateMany + used:false 守卫）。

import { prisma } from './prisma'

const MAX_CODE_ATTEMPTS = 5

export type VerificationPurpose =
  | 'verify'
  | 'login'
  | 'register'
  | 'forgotPassword'
  | 'changePassword'
  | 'deleteAccount'

function failureIncrement(email: string, code: string, purpose: string) {
  // 失败时原子递增同 email+purpose+code 的未使用码尝试次数
  return prisma.verificationCode.updateMany({
    where: {
      email,
      code,
      purpose,
      used: false,
      expiresAt: { gte: new Date() },
    },
    data: { attempts: { increment: 1 } },
  }).catch(() => {})
}

/**
 * 仅校验验证码是否有效（不消费）。
 * 用于 verify-email 这类"预校验"场景。失败时递增 attempts。
 */
export async function checkVerificationCode(
  email: string,
  code: string,
  purpose: VerificationPurpose
): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      purpose,
      used: false,
      attempts: { lt: MAX_CODE_ATTEMPTS },
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!record) {
    await failureIncrement(email, code, purpose)
    return false
  }
  return true
}

/**
 * 校验并原子消费验证码（标记 used:true）。
 * 用于 register / 登录 / 改密 / 删号 等需要"一次性消费"的场景。
 * 通过 updateMany 的 used:false 守卫保证并发下不会一码多用。
 */
export async function consumeVerificationCode(
  email: string,
  code: string,
  purpose: VerificationPurpose
): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      purpose,
      used: false,
      attempts: { lt: MAX_CODE_ATTEMPTS },
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!record) {
    await failureIncrement(email, code, purpose)
    return false
  }
  const consumed = await prisma.verificationCode.updateMany({
    where: { id: record.id, used: false },
    data: { used: true },
  })
  if (consumed.count === 0) {
    // 已被并发请求消费
    return false
  }
  return true
}

export { MAX_CODE_ATTEMPTS }
