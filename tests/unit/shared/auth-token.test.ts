// Bearer 通道 token 工具单测（架构 §4.2.1）

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_TTL_SECONDS,
  base64UrlEncode,
  bytesToHex,
  decodeAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  isAccessTokenExpired,
  isoFromMs,
  refreshTokenExpiry,
  safeEqual,
  signAccessToken,
  verifyAccessToken,
} from 'shared/utils/auth-token'

const SECRET = 'test-access-token-secret-0123456789'

describe('signAccessToken / verifyAccessToken', () => {
  beforeEach(() => {
    process.env.AUTH_ACCESS_TOKEN_SECRET = SECRET
  })

  afterEach(() => {
    delete process.env.AUTH_ACCESS_TOKEN_SECRET
  })

  it('round-trips the claims', async () => {
    const issuedAtMs = Date.parse('2025-06-01T00:00:00.000Z')
    const { token, expiresAtMs } = await signAccessToken(
      { userId: 'user-1', email: 'ada@example.com', role: 'admin' },
      issuedAtMs,
    )
    expect(token.split('.')).toHaveLength(3)
    expect(expiresAtMs).toBe(issuedAtMs + ACCESS_TOKEN_TTL_SECONDS * 1000)

    // 与 signAccessToken 对称地注入「当前时间」，否则按历史 iat 签出的 token 一律判过期
    const verified = await verifyAccessToken(token, issuedAtMs)
    expect(verified).not.toBeNull()
    expect(verified?.userId).toBe('user-1')
    expect(verified?.email).toBe('ada@example.com')
    expect(verified?.role).toBe('admin')
    expect(verified?.expiresAtMs).toBe(expiresAtMs)
  })

  it('encodes the configured issuer and audience', async () => {
    const { token } = await signAccessToken({ userId: 'user-2', email: null, role: 'user' }, Date.now())
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as {
      iss: string
      aud: string
      sub: string
      email: string | null
    }
    expect(payload.iss).toBe(ACCESS_TOKEN_ISSUER)
    expect(payload.aud).toBe(ACCESS_TOKEN_AUDIENCE)
    expect(payload.sub).toBe('user-2')
    expect(payload.email).toBeNull()
  })

  it('rejects a token signed with another secret', async () => {
    const { token } = await signAccessToken({ userId: 'user-3', email: null, role: 'user' }, Date.now())
    process.env.AUTH_ACCESS_TOKEN_SECRET = `${SECRET}-rotated`
    expect(await verifyAccessToken(token)).toBeNull()
  })

  it('rejects an expired token', async () => {
    const issuedAtMs = Date.parse('2020-01-01T00:00:00.000Z')
    const { token } = await signAccessToken({ userId: 'user-4', email: null, role: 'user' }, issuedAtMs)
    expect(await verifyAccessToken(token)).toBeNull()
  })

  it('rejects garbage input', async () => {
    expect(await verifyAccessToken('not-a-jwt')).toBeNull()
    expect(await verifyAccessToken('')).toBeNull()
  })
})

describe('secret configuration', () => {
  afterEach(() => {
    process.env.AUTH_ACCESS_TOKEN_SECRET = SECRET
  })

  it('fails loudly when the secret is missing (SK-8 无非空 fallback)', async () => {
    delete process.env.AUTH_ACCESS_TOKEN_SECRET
    await expect(signAccessToken({ userId: 'u', email: null, role: 'user' }, Date.now())).rejects.toThrow(
      /AUTH_ACCESS_TOKEN_SECRET/,
    )
  })
})

describe('refresh tokens', () => {
  it('is 32 random bytes encoded base64url', async () => {
    const bytes = new Uint8Array(REFRESH_TOKEN_BYTES).fill(7)
    const { token, tokenHash } = await generateRefreshToken(() => bytes)
    expect(token).toBe(base64UrlEncode(bytes))
    expect(token).not.toMatch(/[+/=]/)
    expect(tokenHash).toHaveLength(64)
  })

  it('stores only the SHA-256 hash, never the raw token', async () => {
    const { token, tokenHash } = await generateRefreshToken(() => new Uint8Array(REFRESH_TOKEN_BYTES).fill(3))
    expect(tokenHash).not.toContain(token)
    expect(await hashRefreshToken(token)).toBe(tokenHash)
  })

  it('produces a different hash for a different token', async () => {
    const first = await hashRefreshToken('refresh-a')
    const second = await hashRefreshToken('refresh-b')
    expect(first).not.toBe(second)
  })
})

describe('helpers', () => {
  it('base64UrlEncode is url safe and strips padding', () => {
    expect(base64UrlEncode(new Uint8Array([251, 255, 191]))).not.toMatch(/[+/=]/)
    expect(base64UrlEncode(new Uint8Array([]))).toBe('')
  })

  it('bytesToHex zero pads every byte', () => {
    expect(bytesToHex(new Uint8Array([0, 1, 15, 16, 255]))).toBe('00010f10ff')
  })

  it('safeEqual is constant time and length aware', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('ab', 'abc')).toBe(false)
    expect(safeEqual('', '')).toBe(true)
  })

  it('isoFromMs renders ISO 8601 UTC', () => {
    expect(isoFromMs(0)).toBe('1970-01-01T00:00:00.000Z')
    expect(isoFromMs(Date.parse('2025-06-01T12:00:00.000Z'))).toBe('2025-06-01T12:00:00.000Z')
  })

  it('refreshTokenExpiry is 30 days out', () => {
    const issuedAtMs = Date.parse('2025-01-01T00:00:00.000Z')
    expect(refreshTokenExpiry(issuedAtMs).getTime()).toBe(issuedAtMs + REFRESH_TOKEN_TTL_SECONDS * 1000)
    expect(REFRESH_TOKEN_TTL_SECONDS).toBe(30 * 24 * 60 * 60)
  })
})
