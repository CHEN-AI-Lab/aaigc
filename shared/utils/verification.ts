// Email validation helpers

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string' || email.length > 254) return false
  return EMAIL_RE.test(email)
}

// 邮箱大小写归一化：注册/登录/限流均使用小写邮箱，避免大小写变体绕过唯一约束与计数
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  // Common disposable email domains (can be extended)
  const disposable = new Set([
    'mailinator.com', 'guerrillamail.com', 'tempmail.com',
    'throwaway.email', 'yopmail.com', '10minutemail.com',
    'sharklasers.com', 'trashmail.com', 'maildrop.cc',
    'temp-mail.org', 'fakeinbox.com',
  ])
  return disposable.has(domain)
}

export function generateVerificationCode(): string {
  // 使用加密安全的随机数生成器，避免 Math.random() 的可预测性
  // （V8 xorshift128+ 内部状态可由少量输出恢复，会导致验证码可预测）
  const { randomInt } = require('crypto')
  return randomInt(100000, 1000000).toString()
}

export function isExpired(createdAt: Date, ttlMs: number): boolean {
  return Date.now() - createdAt.getTime() > ttlMs
}

export const VERIFICATION_CODE_TTL = 10 * 60 * 1000 // 10 minutes
export const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
export const MAX_REQUESTS_PER_WINDOW = 3 // 3 codes per minute