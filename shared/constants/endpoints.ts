// ─────────────────────────────────────────────────────────────────────────────
// 第三方服务端点 —— 一律从环境变量读取，禁止硬编码域名（SK-8 / P1-08）
// 未配置时返回空数组（不做非空 fallback），调用方据此返回「服务未配置」错误。
//
// CORS 白名单不属于「第三方端点」，其唯一实现在 ./domains（连同本站 origin），
// 这里只做 re-export，避免两处各写一套。
// ─────────────────────────────────────────────────────────────────────────────

export { corsOrigins, apiCorsOrigins } from './domains'

function readEnv(name: string): string {
  return typeof process !== 'undefined' && process.env ? (process.env[name] ?? '') : ''
}

/** 逗号分隔 → 去空白 → 过滤空串 */
function parseList(raw: string): string[] {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

/**
 * DNS-over-HTTPS 端点列表（`?name=<domain>&type=<TYPE>` 形式的前缀）。
 * 环境变量：DNS_DOH_ENDPOINTS（逗号分隔）
 */
export function dnsDohEndpoints(): string[] {
  return parseList(readEnv('DNS_DOH_ENDPOINTS'))
}

/**
 * IP 归属查询端点列表，支持 `{ip}` 与 `{lang}` 占位符。
 * 环境变量：IP_GEO_ENDPOINTS（逗号分隔）
 */
export function ipGeoEndpoints(): string[] {
  return parseList(readEnv('IP_GEO_ENDPOINTS'))
}

/**
 * 本机公网 IP 回显端点（当无法从请求头取得可信 IP 时使用）。
 * 环境变量：IP_ECHO_ENDPOINT
 */
export function ipEchoEndpoint(): string {
  return readEnv('IP_ECHO_ENDPOINT')
}

/**
 * OAuth 解绑时的**远端撤销端点**：{ "<provider>": "<revoke url>" }
 * 环境变量：OAUTH_REVOKE_ENDPOINTS_JSON
 *
 * 例：{"google":"https://oauth2.googleapis.com/revoke"}
 * 服务端（apps/web/src/app/api/user/unlink-account）据此调 provider 官方 revoke，
 * 未配置的 provider 只删本地绑定记录并告警，不做非空 fallback（SK-8）。
 */
export function oauthRevokeEndpoints(): Record<string, string> {
  const raw = readEnv('OAUTH_REVOKE_ENDPOINTS_JSON')
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string' && value.length > 0) out[key] = value
    }
    return out
  } catch {
    return {}
  }
}

/**
 * 各端下载链接 JSON：{ "<platform>": "<url>" }
 * 环境变量：NATIVE_APP_DOWNLOAD_URLS_JSON
 */
export function nativeAppDownloadUrls(): Record<string, string> {
  const raw = readEnv('NATIVE_APP_DOWNLOAD_URLS_JSON')
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string' && value.length > 0) out[key] = value
    }
    return out
  } catch {
    return {}
  }
}

/**
 * 11 个产品的 URL 映射 JSON：{ "<productId>": { url?, previewUrl?, productionUrl? } }
 * 环境变量：PRODUCT_URL_MAP_JSON
 */
export interface ProductUrlEntry {
  url?: string
  previewUrl?: string
  productionUrl?: string
}

export function productUrlMap(): Record<string, ProductUrlEntry> {
  const raw = readEnv('PRODUCT_URL_MAP_JSON')
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, ProductUrlEntry> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue
      const entry = value as Record<string, unknown>
      const item: ProductUrlEntry = {}
      if (typeof entry.url === 'string') item.url = entry.url
      if (typeof entry.previewUrl === 'string') item.previewUrl = entry.previewUrl
      if (typeof entry.productionUrl === 'string') item.productionUrl = entry.productionUrl
      out[key] = item
    }
    return out
  } catch {
    return {}
  }
}
