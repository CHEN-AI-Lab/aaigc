// Email validation helpers
export function isValidEmail(email: string): boolean {
  // RFC 5322 simplified - reasonable email format check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  // Common disposable email domains (can be extended)
  const disposable = new Set([
    'mailinator.com', 'guerrillamail.com', 'tempmail.com',
    'throwaway.email', 'yopmail.com', '10minutemail.com',
    'sharklasers.com', 'trashmail.com', 'maildrop.cc',
    'temp-mail.org', 'fakeinbox.com', 'mailnator.com',
  ])
  return disposable.has(domain)
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function isExpired(createdAt: Date, ttlMs: number): boolean {
  return Date.now() - createdAt.getTime() > ttlMs
}

export const VERIFICATION_CODE_TTL = 10 * 60 * 1000 // 10 minutes
export const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
export const MAX_REQUESTS_PER_WINDOW = 3 // 3 codes per minute