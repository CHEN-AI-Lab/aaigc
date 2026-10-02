// shared/utils/ip.test.ts —— IP 提取 + 私有 IP 判定
//
// 覆盖：
//   1. getTrustedClientIp 优先级（ip > x-vercel-forwarded-for > x-forwarded-for > x-real-ip > 'unknown'）
//   2. 多段 x-forwarded-for 取首段
//   3. isPrivateOrReservedIp：IPv4 私有段全覆盖
//   4. isPrivateOrReservedIp：IPv6 (含 IPv4-mapped)
//   5. 非法 IPv4 字符串 → 返回 false（不抛错）

import { describe, it, expect } from 'vitest'
import { getTrustedClientIp, isPrivateOrReservedIp } from 'shared/utils/ip'

function makeReq(headers: Record<string, string>, ip?: string): { headers: Headers; ip?: string } {
  const h = new Headers()
  for (const [k, v] of Object.entries(headers)) h.set(k, v)
  return { headers: h, ...(ip ? { ip } : {}) }
}

describe('getTrustedClientIp', () => {
  it('prefers NextRequest.ip over all headers', () => {
    const req = makeReq(
      { 'x-vercel-forwarded-for': '1.1.1.1', 'x-forwarded-for': '2.2.2.2', 'x-real-ip': '3.3.3.3' },
      '9.9.9.9'
    )
    expect(getTrustedClientIp(req)).toBe('9.9.9.9')
  })

  it('uses x-vercel-forwarded-for when no direct ip', () => {
    const req = makeReq({ 'x-vercel-forwarded-for': '1.1.1.1, 2.2.2.2' })
    expect(getTrustedClientIp(req)).toBe('1.1.1.1')
  })

  it('uses first segment of x-forwarded-for as fallback', () => {
    const req = makeReq({ 'x-forwarded-for': '8.8.8.8, 1.1.1.1, 9.9.9.9' })
    expect(getTrustedClientIp(req)).toBe('8.8.8.8')
  })

  it('uses x-real-ip when x-forwarded-for missing', () => {
    const req = makeReq({ 'x-real-ip': '5.5.5.5' })
    expect(getTrustedClientIp(req)).toBe('5.5.5.5')
  })

  it('returns "unknown" when no source available', () => {
    expect(getTrustedClientIp(makeReq({}))).toBe('unknown')
  })

  it('trims whitespace from all sources', () => {
    expect(getTrustedClientIp(makeReq({ 'x-real-ip': '  5.5.5.5  ' }))).toBe('5.5.5.5')
    expect(getTrustedClientIp(makeReq({ 'x-forwarded-for': ' 8.8.8.8 , 1.1.1.1 ' }))).toBe('8.8.8.8')
  })

  it('falls through to next source when current is empty', () => {
    // x-vercel-forwarded-for 是空字符串
    expect(
      getTrustedClientIp(
        makeReq({ 'x-vercel-forwarded-for': '', 'x-forwarded-for': '8.8.8.8' })
      )
    ).toBe('8.8.8.8')
  })
})

describe('isPrivateOrReservedIp - IPv4', () => {
  const PRIVATE_V4 = [
    '127.0.0.1',           // loopback
    '127.255.255.254',     // loopback 边界
    '10.0.0.1',            // private 10/8
    '10.255.255.255',
    '172.16.0.1',          // private 172.16/12
    '172.31.255.255',
    '192.168.1.1',         // private 192.168/16
    '169.254.1.1',         // link-local
    '169.254.169.254',     // AWS metadata
    '0.0.0.1',             // "this network"
    '100.64.0.1',          // CGNAT
    '100.127.255.255',
  ]

  const PUBLIC_V4 = [
    '8.8.8.8',
    '1.1.1.1',
    '172.32.0.1',          // 不在 172.16-31
    '172.15.0.1',          // 不在 172.16-31
    '11.0.0.1',            // 不在 10/8
    '9.255.255.255',
  ]

  it.each(PRIVATE_V4)('detects %s as private', (ip) => {
    expect(isPrivateOrReservedIp(ip)).toBe(true)
  })

  it.each(PUBLIC_V4)('detects %s as public', (ip) => {
    expect(isPrivateOrReservedIp(ip)).toBe(false)
  })

  it('returns false for malformed IPv4', () => {
    expect(isPrivateOrReservedIp('256.1.1.1')).toBe(false) // 段超界
    expect(isPrivateOrReservedIp('1.1.1')).toBe(false)     // 段数不够
    expect(isPrivateOrReservedIp('1.1.1.1.1')).toBe(false) // 段数过多
    expect(isPrivateOrReservedIp('abc.def.ghi.jkl')).toBe(false)
    expect(isPrivateOrReservedIp('')).toBe(false)
  })
})

describe('isPrivateOrReservedIp - IPv6', () => {
  it('detects ::1 (loopback) and :: (unspecified)', () => {
    expect(isPrivateOrReservedIp('::1')).toBe(true)
    expect(isPrivateOrReservedIp('::')).toBe(true)
  })

  it('detects fc00::/7 (unique local) as private', () => {
    expect(isPrivateOrReservedIp('fc00::1')).toBe(true)
    expect(isPrivateOrReservedIp('fd00::1')).toBe(true)
    expect(isPrivateOrReservedIp('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true)
  })

  it('detects fe80::/10 (link-local) as private', () => {
    expect(isPrivateOrReservedIp('fe80::1')).toBe(true)
    expect(isPrivateOrReservedIp('fea0::1')).toBe(true)
    expect(isPrivateOrReservedIp('febf:ffff::')).toBe(true)
  })

  it('detects IPv4-mapped IPv6 ::ffff:x.x.x.x', () => {
    expect(isPrivateOrReservedIp('::ffff:127.0.0.1')).toBe(true)  // IPv4 loopback
    expect(isPrivateOrReservedIp('::ffff:10.0.0.1')).toBe(true)   // IPv4 private
    expect(isPrivateOrReservedIp('::ffff:192.168.1.1')).toBe(true) // IPv4 private
    expect(isPrivateOrReservedIp('::ffff:8.8.8.8')).toBe(false)   // IPv4 public
  })

  it('detects public IPv6 as not private', () => {
    expect(isPrivateOrReservedIp('2001:db8::1')).toBe(false)
    expect(isPrivateOrReservedIp('2606:4700:4700::1111')).toBe(false) // Cloudflare DNS
  })

  it('handles case insensitivity', () => {
    expect(isPrivateOrReservedIp('::FFFF:127.0.0.1')).toBe(true)
    expect(isPrivateOrReservedIp('FC00::1')).toBe(true)
  })

  it('trims whitespace', () => {
    expect(isPrivateOrReservedIp('  10.0.0.1  ')).toBe(true)
    expect(isPrivateOrReservedIp('  8.8.8.8  ')).toBe(false)
  })
})
