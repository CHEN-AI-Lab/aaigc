// ─────────────────────────────────────────────────────────────────────────────
// Bearer 通道的 access / refresh token 工具（架构 §4.2.1）
//
// access  = JWT（jose 签名，TTL 15 分钟，无状态，Edge 可验）
// refresh = 随机 32 字节，仅存 hash 于 RefreshToken 表（TTL 30 天，可撤销、可审计）
//
// 密钥一律来自环境变量，禁止非空 fallback（SK-8）。
// ─────────────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify, decodeJwt } from 'jose'

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60
export const REFRESH_TOKEN_BYTES = 32

export const ACCESS_TOKEN_ISSUER = 'aaigc'
export const ACCESS_TOKEN_AUDIENCE = 'aaigc-clients'

export interface AccessTokenClaims {
  userId: string
  email: string | null
  role: string
}

export interface VerifiedAccessToken extends AccessTokenClaims {
  expiresAtMs: number
}

function secret(): Uint8Array {
  const raw = typeof process !== 'undefined' ? process.env.AUTH_ACCESS_TOKEN_SECRET : undefined
  if (!raw || raw.length === 0) {
    throw new Error('AUTH_ACCESS_TOKEN_SECRET is not configured')
  }
  return new TextEncoder().encode(raw)
}

/** 签发 access token（JWT，15 分钟） */
export async function signAccessToken(
  claims: AccessTokenClaims,
  issuedAtMs: number = Date.now(),
): Promise<{ token: string; expiresAtMs: number }> {
  const issuedAt = Math.floor(issuedAtMs / 1000)
  const expiresAt = issuedAt + ACCESS_TOKEN_TTL_SECONDS
  const token = await new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.userId)
    .setIssuer(ACCESS_TOKEN_ISSUER)
    .setAudience(ACCESS_TOKEN_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(secret())
  return { token, expiresAtMs: expiresAt * 1000 }
}

/**
 * 校验 access token；无效/过期返回 null。
 *
 * `currentTimeMs` 与 `signAccessToken(claims, issuedAtMs)` 对称：
 * 生产环境省略即用 `Date.now()`，测试/回放场景可注入「当前时间」，
 * 这样按历史 iat 签出的 token 也能被确定性校验（否则一律判为过期）。
 */
export async function verifyAccessToken(
  token: string,
  currentTimeMs: number = Date.now(),
): Promise<VerifiedAccessToken | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: ACCESS_TOKEN_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE,
      currentDate: new Date(currentTimeMs),
    })
    const userId = typeof payload.sub === 'string' ? payload.sub : null
    if (!userId) return null
    return {
      userId,
      email: typeof payload.email === 'string' ? payload.email : null,
      role: typeof payload.role === 'string' ? payload.role : 'user',
      expiresAtMs: typeof payload.exp === 'number' ? payload.exp * 1000 : 0,
    }
  } catch {
    return null
  }
}

/** **未验签**的 JWT payload 片段（只用于错误分类，绝不用于授权） */
export interface DecodedAccessToken {
  /** JWT `sub`（= userId）；缺失为 undefined */
  sub?: string
  /** JWT `exp`（秒）；缺失为 undefined */
  exp?: number
}

/**
 * **只解** JWT payload，不做签名校验。
 *
 * 存在理由：`verifyAccessToken` 对「过期 / 签名不对 / 结构非法」一律返回 null，
 * 调用方无法区分；而客户端需要区分——
 *   · 过期 → `tokenExpired`：refresh 后重试即可；
 *   · 伪造 / 结构非法 → `tokenInvalid`：重试没用，必须丢弃凭证重新登录。
 *
 * 结构非法（不是三段 / payload 非 base64url / 非 JSON / 非对象）→ null。
 * **安全约束**：返回值仅供错误分类，任何授权判断都必须走 `verifyAccessToken`。
 */
export function decodeAccessToken(token: string): DecodedAccessToken | null {
  try {
    const payload = decodeJwt(token)
    return {
      sub: typeof payload.sub === 'string' ? payload.sub : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    }
  } catch {
    return null
  }
}

/**
 * 解码结果是否已过期。
 *
 * `nowMs` 与 `signAccessToken(claims, issuedAtMs)` 对称：生产省略即用 `Date.now()`，
 * 测试/回放可注入「当前时间」，让按历史 iat 签出的 token 也能被确定性判定。
 * **缺 `exp` 不算过期**（返回 false）——缺 exp 是结构不完整，应按 `tokenInvalid` 处理。
 */
export function isAccessTokenExpired(decoded: DecodedAccessToken, nowMs: number = Date.now()): boolean {
  return typeof decoded.exp === 'number' && decoded.exp * 1000 <= nowMs
}

/**
 * 生成 refresh token：返回原文（只发给客户端一次）与 hash（入库）。
 * 原文不落库，库泄露也无法冒用。
 */
export async function generateRefreshToken(
  randomBytes: (length: number) => Uint8Array = defaultRandomBytes,
): Promise<{ token: string; tokenHash: string }> {
  const bytes = randomBytes(REFRESH_TOKEN_BYTES)
  const token = base64UrlEncode(bytes)
  const tokenHash = await hashRefreshToken(token)
  return { token, tokenHash }
}

function defaultRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  const cryptoObj = globalThis.crypto
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes)
    return bytes
  }
  throw new Error('No secure random source available')
}

/** refresh token 的 SHA-256 hex 摘要（入库形态） */
export async function hashRefreshToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('WebCrypto subtle is not available')
  const digest = await subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(digest))
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function bytesToHex(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0')
  return out
}

/** 恒定时间字符串比较（避免时序侧信道） */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** ISO 8601 UTC 字符串 */
export function isoFromMs(ms: number): string {
  return new Date(ms).toISOString()
}

export function refreshTokenExpiry(issuedAtMs: number = Date.now()): Date {
  return new Date(issuedAtMs + REFRESH_TOKEN_TTL_SECONDS * 1000)
}
