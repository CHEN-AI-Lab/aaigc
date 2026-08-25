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
  // 防爆破 H3 修复：失败时不再对 email+purpose+code 原子 updateMany
  // （攻击者每次都试不同错误码也碰不到这条记录），
  // 而是定位到「同 email+purpose 的最新未用码」用 update 增量 attempts。
  // 这样不论提交错码对码，只要该邮箱最新未用码还在，attempts 就累加，达到 MAX 即封禁。
  // 无未用码时安静返回（不要抛错，调用方已经把请求判为失败了）。
  return prisma.verificationCode
    .findFirst({
      where: {
        email,
        purpose,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })
    .then((latest) => {
      if (!latest) return null
      return prisma.verificationCode.update({
        where: { id: latest.id },
        data: { attempts: { increment: 1 } },
      })
    })
    .catch(() => null)
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
