import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  isDisposableEmail,
  generateVerificationCode,
  isExpired,
  VERIFICATION_CODE_TTL,
  RATE_LIMIT_WINDOW,
  MAX_REQUESTS_PER_WINDOW,
} from '../../shared/utils/verification'

describe('verification utils', () => {
  it('isValidEmail accepts normal emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('a.b+c@sub.domain.co')).toBe(true)
  })

  it('isValidEmail rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user name@example.com')).toBe(false)
  })

  it('isDisposableEmail flags known disposable domains', () => {
    expect(isDisposableEmail('x@mailinator.com')).toBe(true)
    expect(isDisposableEmail('x@tempmail.com')).toBe(true)
  })

  it('isDisposableEmail accepts normal domains', () => {
    expect(isDisposableEmail('x@gmail.com')).toBe(false)
    expect(isDisposableEmail('x@example.com')).toBe(false)
  })

  it('generateVerificationCode returns 6-digit code', () => {
    const code = generateVerificationCode()
    expect(code).toMatch(/^\d{6}$/)
  })

  it('generateVerificationCode produces varying codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateVerificationCode()))
    expect(codes.size).toBeGreaterThan(1)
  })

  it('isExpired returns true for past timestamps', () => {
    expect(isExpired(new Date(Date.now() - 2000), 1000)).toBe(true)
  })

  it('isExpired returns false for fresh timestamps', () => {
    expect(isExpired(new Date(Date.now()), 60000)).toBe(false)
  })

  it('exposes sane rate-limit constants', () => {
    expect(VERIFICATION_CODE_TTL).toBe(10 * 60 * 1000)
    expect(RATE_LIMIT_WINDOW).toBe(60 * 1000)
    expect(MAX_REQUESTS_PER_WINDOW).toBeGreaterThan(0)
  })
})