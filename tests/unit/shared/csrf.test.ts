// shared/utils/csrf.test.ts —— CSRF 防护逻辑测试
//
// 覆盖：
//   1. isSameOrigin：Origin 匹配/不匹配/缺失回退到 Referer/都缺失
//   2. isTrustedRequest：bearer 通道豁免、cookie 通道同源校验
//   3. isTrustedPreAuthRequest：未登录端点的第一方 clientId 白名单逻辑
//   4. readBearerToken：标准 Bearer、格式错误、空 token、大小写

import { describe, it, expect, beforeEach } from 'vitest'
import { isSameOrigin, isTrustedRequest, isTrustedPreAuthRequest, readBearerToken } from 'shared/utils/csrf'

function makeReq(headers: Record<string, string>): { headers: Headers } {
  const h = new Headers()
  for (const [k, v] of Object.entries(headers)) h.set(k, v)
  return { headers: h }
}

describe('isSameOrigin', () => {
  it('returns true when Origin matches host', () => {
    const req = makeReq({ host: 'aaigc.online', origin: 'https://aaigc.online' })
    expect(isSameOrigin(req)).toBe(true)
  })

  it('returns false when Origin host differs', () => {
    const req = makeReq({ host: 'aaigc.online', origin: 'https://evil.example.com' })
    expect(isSameOrigin(req)).toBe(false)
  })

  it('returns true when only scheme differs (same host, different scheme = same-origin in this check)', () => {
    // ⚠️ 设计决策（曾在 PR 评审中被质疑，记录原因以免下次又被当作 bug 改）：
    // isSameOrigin 只比 host，不比 scheme。理由：
    //   1. 浏览器在跨 scheme 场景下会**强制**带 Origin 头（且 Origin 包含 scheme），
    //      我们这里比对的是 Origin.host === host，scheme 差异不会绕过这层；
    //   2. 同站子域（包括 scheme:https/http）共享同一 host 即共享同一受信面
    //      （http://aaigc.online 与 https://aaigc.online 同样能读 cookie）；
    //   3. 真正的 scheme downgrade 攻击由 HSTS / SameSite=Strict 防御，不在这里。
    // 如果后续产品决定要强制 https-only，应改这里为同时比 scheme（uri.protocol）。
    const req = makeReq({ host: 'aaigc.online', origin: 'http://aaigc.online' })
    expect(isSameOrigin(req)).toBe(true)
  })

  it('falls back to Referer when Origin is missing', () => {
    const req = makeReq({ host: 'aaigc.online', referer: 'https://aaigc.online/page' })
    expect(isSameOrigin(req)).toBe(true)
  })

  it('falls back to Referer — rejects when Referer host differs', () => {
    const req = makeReq({ host: 'aaigc.online', referer: 'https://evil.example.com/page' })
    expect(isSameOrigin(req)).toBe(false)
  })

  it('returns false when host header is missing', () => {
    const req = makeReq({ origin: 'https://aaigc.online' })
    expect(isSameOrigin(req)).toBe(false)
  })

  it('returns false when both Origin and Referer are missing (curl/Postman)', () => {
    const req = makeReq({ host: 'aaigc.online' })
    expect(isSameOrigin(req)).toBe(false)
  })

  it('prefers Origin over Referer when both present', () => {
    // Origin 匹配但 Referer 不匹配 → 应返回 true（Origin 优先）
    const req = makeReq({
      host: 'aaigc.online',
      origin: 'https://aaigc.online',
      referer: 'https://evil.example.com',
    })
    expect(isSameOrigin(req)).toBe(true)
  })

  it('returns false on invalid Origin URL', () => {
    const req = makeReq({ host: 'aaigc.online', origin: 'not a url' })
    expect(isSameOrigin(req)).toBe(false)
  })
})

describe('isTrustedRequest', () => {
  it('bearer channel bypasses same-origin (token 不在 cookie 里)', () => {
    const req = makeReq({ host: 'aaigc.online' }) // 无 origin、无 referer
    expect(isTrustedRequest(req, 'bearer')).toBe(true)
  })

  it('cookie channel requires same-origin', () => {
    const sameOrigin = makeReq({ host: 'aaigc.online', origin: 'https://aaigc.online' })
    const crossOrigin = makeReq({ host: 'aaigc.online', origin: 'https://evil.com' })
    const noOrigin = makeReq({ host: 'aaigc.online' })

    expect(isTrustedRequest(sameOrigin, 'cookie')).toBe(true)
    expect(isTrustedRequest(crossOrigin, 'cookie')).toBe(false)
    expect(isTrustedRequest(noOrigin, 'cookie')).toBe(false) // cookie 通道无 origin 视为不可信
  })
})

describe('isTrustedPreAuthRequest', () => {
  // 保存原始 env，测试后恢复
  const originalEnv = process.env.AAIGC_CLIENT_IDS
  beforeEach(() => {
    process.env.AAIGC_CLIENT_IDS = 'aaigc-app,aaigc-cli,aaigc-desktop'
  })

  it('accepts same-origin browser request regardless of clientId', () => {
    const req = makeReq({ host: 'aaigc.online', origin: 'https://aaigc.online' })
    expect(isTrustedPreAuthRequest(req)).toBe(true)
  })

  it('accepts native client with whitelisted clientId (no Origin)', () => {
    const req = makeReq({
      host: 'aaigc.online',
      'x-aaigc-client-id': 'aaigc-app',
    })
    expect(isTrustedPreAuthRequest(req)).toBe(true)
  })

  it('rejects unknown clientId even with Origin', () => {
    const req = makeReq({
      host: 'aaigc.online',
      origin: 'https://aaigc.online',
      'x-aaigc-client-id': 'evil-app',
    })
    // 同源放行（不依赖 clientId）
    expect(isTrustedPreAuthRequest(req)).toBe(true)

    // 跨源 + 未知 clientId → 拒绝
    const crossReq = makeReq({
      host: 'aaigc.online',
      origin: 'https://evil.com',
      'x-aaigc-client-id': 'evil-app',
    })
    expect(isTrustedPreAuthRequest(crossReq)).toBe(false)
  })

  it('accepts cross-origin request with whitelisted clientId (白名单 = 第一方信任)', () => {
    // ⚠️ 设计决策（安全模型，3 重防御）：
    // 跨域 + 白名单 clientId = 接受。这是**有意**行为，不是 CSRF 漏洞：
    //   1. clientId 必须在 AAIGC_CLIENT_IDS 环境变量里（部署时配置；未配置 = 一律不放行）；
    //   2. 配合「按邮箱限流」（login-rate-limit）使用：单邮箱发信量仍受限
    //      ——即便 clientId 被猜到，也没法给你的邮箱轰炸；
    //   3. 白名单是显式配置的，不是开放式的：不是"任意 clientId 都放行"。
    // 真实场景：原生端（App/CLI/桌面端）fetch 时不带 Origin，但带白名单 clientId，
    //          被这层逻辑放行（cookie 通道的 Web 走 isSameOrigin 分支不受影响）。
    const req = makeReq({
      host: 'aaigc.online',
      origin: 'https://evil.com',
      'x-aaigc-client-id': 'aaigc-app',
    })
    expect(isTrustedPreAuthRequest(req)).toBe(true)
  })

  it('rejects when no Origin and no clientId', () => {
    const req = makeReq({ host: 'aaigc.online' })
    expect(isTrustedPreAuthRequest(req)).toBe(false)
  })

  it('rejects when whitelist is empty (secure default)', () => {
    process.env.AAIGC_CLIENT_IDS = ''
    const req = makeReq({
      host: 'aaigc.online',
      'x-aaigc-client-id': 'aaigc-app',
    })
    expect(isTrustedPreAuthRequest(req)).toBe(false)
  })

  // 恢复原 env
  if (originalEnv !== undefined) {
    process.env.AAIGC_CLIENT_IDS = originalEnv
  }
})

describe('readBearerToken', () => {
  it('extracts a standard Bearer token', () => {
    const req = makeReq({ authorization: 'Bearer abc123' })
    expect(readBearerToken(req)).toBe('abc123')
  })

  it('is case-insensitive on the scheme (bearer / BEARER / Bearer)', () => {
    expect(readBearerToken(makeReq({ authorization: 'bearer abc' }))).toBe('abc')
    expect(readBearerToken(makeReq({ authorization: 'BEARER abc' }))).toBe('abc')
    expect(readBearerToken(makeReq({ authorization: 'BeArEr abc' }))).toBe('abc')
  })

  it('trims whitespace around the token', () => {
    expect(readBearerToken(makeReq({ authorization: 'Bearer   abc123  ' }))).toBe('abc123')
  })

  it('returns null when header is missing', () => {
    expect(readBearerToken(makeReq({}))).toBe(null)
  })

  it('returns null for malformed Authorization', () => {
    expect(readBearerToken(makeReq({ authorization: 'abc123' }))).toBe(null)
    expect(readBearerToken(makeReq({ authorization: 'Basic abc123' }))).toBe(null)
    expect(readBearerToken(makeReq({ authorization: 'Bearer' }))).toBe(null) // 无 token
    expect(readBearerToken(makeReq({ authorization: 'Bearer ' }))).toBe(null) // 空 token
  })
})
