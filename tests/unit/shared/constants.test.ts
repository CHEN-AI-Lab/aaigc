// 常量层单测：错误码 ↔ HTTP 状态 ↔ i18n key 的一致性，以及端点配置的「无硬编码」约束

import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  API_ERROR_CODES,
  API_ERROR_STATUS,
  LEGACY_API_ERROR_CODES,
  MULTI_CLIENT_API_ERROR_CODES,
  isApiErrorCode,
  apiErrorBody,
  statusForErrorCode,
} from 'shared/constants/error-codes'
import {
  corsOrigins,
  dnsDohEndpoints,
  ipEchoEndpoint,
  ipGeoEndpoints,
  nativeAppDownloadUrls,
  productUrlMap,
  DNS_DOH_ENDPOINTS,
  IP_GEO_ENDPOINTS,
  IP_ECHO_ENDPOINT,
} from 'shared/constants/endpoints'
import { isSameOrigin, isTrustedRequest, readBearerToken } from 'shared/utils/csrf'

const MESSAGES_DIR = path.resolve(__dirname, '../../../shared/messages')
const LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja'] as const

function request(headers: Record<string, string>): { headers: Headers } {
  return { headers: new Headers(headers) }
}

describe('error codes', () => {
  it('has no duplicates across legacy and multi-client codes', () => {
    expect(new Set(API_ERROR_CODES).size).toBe(API_ERROR_CODES.length)
  })

  it('keeps every legacy code so Web behaviour is unchanged', () => {
    for (const code of LEGACY_API_ERROR_CODES) {
      expect(isApiErrorCode(code)).toBe(true)
    }
    expect(LEGACY_API_ERROR_CODES.length).toBe(50)
  })

  it('maps every code to a status', () => {
    for (const code of API_ERROR_CODES) {
      const status = API_ERROR_STATUS[code]
      expect(typeof status, code).toBe('number')
      expect(status).toBeGreaterThanOrEqual(400)
      expect(status).toBeLessThan(600)
    }
  })

  it('exposes the multi-client codes introduced by the Bearer channel', () => {
    for (const code of ['tokenInvalid', 'tokenExpired', 'refreshTokenInvalid', 'authorizationPending', 'networkFailed']) {
      expect(MULTI_CLIENT_API_ERROR_CODES as readonly string[]).toContain(code)
      expect(isApiErrorCode(code)).toBe(true)
    }
  })

  it('rejects unknown strings', () => {
    expect(isApiErrorCode('definitelyNotACode')).toBe(false)
    expect(isApiErrorCode('')).toBe(false)
  })

  it('builds the fixed response shape consumed by the Web i18n layer', () => {
    expect(apiErrorBody('tokenExpired')).toEqual({ error: 'tokenExpired' })
    expect(apiErrorBody('rateLimited', { seconds: 30 })).toEqual({ error: 'rateLimited', errorParams: { seconds: 30 } })
  })

  it('statusForErrorCode mirrors the mapping table', () => {
    expect(statusForErrorCode('notFound')).toBe(API_ERROR_STATUS.notFound)
    expect(statusForErrorCode('tokenInvalid')).toBe(401)
  })

  it('has an errors.* i18n key in all four locales', () => {
    for (const locale of LOCALES) {
      const raw = fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf8')
      const messages = JSON.parse(raw) as { errors?: Record<string, string> }
      const errors = messages.errors ?? {}
      for (const code of API_ERROR_CODES) {
        expect(typeof errors[code], `${locale}.errors.${code}`).toBe('string')
        expect(errors[code]?.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('endpoint configuration', () => {
  const keys = [
    'DNS_DOH_ENDPOINTS',
    'IP_GEO_ENDPOINTS',
    'IP_ECHO_ENDPOINT',
    'API_CORS_ORIGINS',
    'NATIVE_APP_DOWNLOAD_URLS_JSON',
    'PRODUCT_URL_MAP_JSON',
  ]
  const saved = new Map<string, string | undefined>()

  afterEach(() => {
    for (const key of keys) {
      const previous = saved.get(key)
      if (previous === undefined) delete process.env[key]
      else process.env[key] = previous
    }
    saved.clear()
  })

  it('第三方端点来自常量：不配置也能用（固定的公共服务端点，不是环境相关配置)', () => {
    // 这三个是 DNS 解析 / IP 归属查询 / IP 回显的公共服务端点，
    // 不像 API 基址那样随部署环境变化 —— 2026-09-21 从「读 env 且无 fallback」改回常量，
    // 原因是 env 化后没配就 503，连 Web 端线上也一起挂。
    expect(dnsDohEndpoints()).toEqual([...DNS_DOH_ENDPOINTS])
    expect(ipGeoEndpoints()).toEqual([...IP_GEO_ENDPOINTS])
    expect(ipEchoEndpoint()).toBe(IP_ECHO_ENDPOINT)
    expect(dnsDohEndpoints().length).toBeGreaterThan(0)
    expect(ipGeoEndpoints().length).toBeGreaterThan(0)
  })

  it('环境相关的配置项未配置时仍为空（不做非空 fallback）', () => {
    for (const key of keys) {
      saved.set(key, process.env[key])
      delete process.env[key]
    }
    // CORS 白名单 / 下载链接 / 产品 URL 会随部署环境变化，仍走环境变量：
    // 未配置 → 空，绝不偷偷用内置值。
    expect(corsOrigins()).toEqual([])
    expect(nativeAppDownloadUrls()).toEqual({})
    expect(productUrlMap()).toEqual({})
  })

  it('parses the product url map and drops invalid entries', () => {
    process.env.PRODUCT_URL_MAP_JSON = JSON.stringify({
      p1: { url: 'https://p1.test', previewUrl: 'https://prev.test' },
      bad: 42,
      nothing: null,
    })
    expect(productUrlMap()).toEqual({ p1: { url: 'https://p1.test', previewUrl: 'https://prev.test' } })
  })

  it('parses the download url map and drops non-string values', () => {
    process.env.NATIVE_APP_DOWNLOAD_URLS_JSON = JSON.stringify({ desktop: 'https://d.test/app', bad: 42, empty: '' })
    expect(nativeAppDownloadUrls()).toEqual({ desktop: 'https://d.test/app' })
  })

  it('survives malformed JSON', () => {
    process.env.PRODUCT_URL_MAP_JSON = '{not json'
    expect(productUrlMap()).toEqual({})
  })

  it('keeps only string url fields in the product map', () => {
    process.env.PRODUCT_URL_MAP_JSON = JSON.stringify({
      aaigc: { url: 'https://p.test/aaigc', previewUrl: 'https://p.test/preview', bad: 1 },
      broken: 'not-an-object',
    })
    expect(productUrlMap()).toEqual({
      aaigc: { url: 'https://p.test/aaigc', previewUrl: 'https://p.test/preview' },
    })
  })

  it('第三方端点集中定义在常量文件，业务代码不得重复写死域名', () => {
    // 策略（2026-09-21 修正）：固定的公共服务端点集中定义在 shared/constants/endpoints.ts。
    // 因此这个文件**是唯一允许出现这些域名的地方**；业务代码必须从这里取，不许自己写。
    const repoRoot = path.resolve(__dirname, '../../..')
    const hosts = /https?:\/\/[a-z0-9.-]*(?:ipinfo\.io|ip-api\.com|ip\.sb|alidns\.com|dns\.google|ipify\.org)/i

    const strip = (src: string) =>
      src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('//'))
        .join('\n')

    // 1) 常量文件里确实定义了这些端点（防止有人把常量清空后工具静默失效）
    const constantsFile = path.join(repoRoot, 'shared/constants/endpoints.ts')
    expect(strip(fs.readFileSync(constantsFile, 'utf8')).match(hosts)).not.toBeNull()

    // 2) 业务侧不得再写死端点
    for (const rel of [
      'apps/web/src/app/api/tools/ip-lookup/route.ts',
      'apps/web/src/app/api/tools/dns-lookup/route.ts',
    ]) {
      const p = path.join(repoRoot, rel)
      if (!fs.existsSync(p)) continue
      expect(strip(fs.readFileSync(p, 'utf8'))).not.toMatch(hosts)
    }
  })
})

describe('csrf / trusted request', () => {
  it('accepts a matching Origin', () => {
    expect(isSameOrigin(request({ origin: 'https://aaigc.test', host: 'aaigc.test' }))).toBe(true)
  })

  it('rejects a cross-site Origin', () => {
    expect(isSameOrigin(request({ origin: 'https://evil.test', host: 'aaigc.test' }))).toBe(false)
  })

  it('falls back to Referer when Origin is absent', () => {
    expect(isSameOrigin(request({ referer: 'https://aaigc.test/tools', host: 'aaigc.test' }))).toBe(true)
  })

  it('rejects when both headers are missing (unchanged legacy behaviour)', () => {
    expect(isSameOrigin(request({ host: 'aaigc.test' }))).toBe(false)
    expect(isSameOrigin(request({}))).toBe(false)
  })

  it('exempts the Bearer channel from the same-origin check', () => {
    const bare = request({ host: 'aaigc.test' })
    expect(isTrustedRequest(bare, 'bearer')).toBe(true)
    expect(isTrustedRequest(bare, 'cookie')).toBe(false)
    expect(isTrustedRequest(request({ origin: 'https://aaigc.test', host: 'aaigc.test' }), 'cookie')).toBe(true)
  })

  it('reads the bearer token case-insensitively', () => {
    expect(readBearerToken(request({ authorization: 'Bearer abc.def' }))).toBe('abc.def')
    expect(readBearerToken(request({ authorization: 'bearer   abc.def  ' }))).toBe('abc.def')
    expect(readBearerToken(request({ authorization: 'Basic abc' }))).toBeNull()
    expect(readBearerToken(request({ authorization: 'Bearer ' }))).toBeNull()
    expect(readBearerToken(request({}))).toBeNull()
  })
})
