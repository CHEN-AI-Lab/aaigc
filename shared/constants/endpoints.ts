// ─────────────────────────────────────────────────────────────────────────────
// 第三方服务端点 —— 集中在本文件，业务代码一律从这里取，不得自己写域名。
//
// ⚠️ 为什么是**常量**而不是环境变量（2026-09-21 修正，此前判断有误）：
//   这些是**固定的公共服务端点**（DNS 解析、IP 归属查询），不像 API 基址那样随部署环境
//   变化。此前把它们做成环境变量且禁止非空 fallback，结果：
//     · 没配 → dns-lookup / ip-lookup 一律 503
//     · 凭空制造了一个部署依赖，且**连 Web 端线上也一起挂**
//   集中到常量后：换服务商只改这一处并重新部署，不会再因为"忘记配环境变量"而失效。
//
//   真正随环境变化、因此**仍走环境变量**的只有下面这三个（见本文件后半部分）：
//   OAUTH_REVOKE_ENDPOINTS_JSON / NATIVE_APP_DOWNLOAD_URLS_JSON / PRODUCT_URL_MAP_JSON。
//
// CORS 白名单不属于「第三方端点」，其唯一实现在 ./domains（连同本站 origin），
// 这里只做 re-export，避免两处各写一套。
// ─────────────────────────────────────────────────────────────────────────────

export { corsOrigins, apiCorsOrigins } from './domains'

function readEnv(name: string): string {
  return typeof process !== 'undefined' && process.env ? (process.env[name] ?? '') : ''
}

/**
 * DNS-over-HTTPS 端点（按顺序 failover）。
 * 调用方自行拼 `?name=<domain>&type=<TYPE>`，故这里只存前缀、不含 query。
 */
export const DNS_DOH_ENDPOINTS: readonly string[] = [
  'https://dns.alidns.com/resolve',
  'https://dns.google/resolve',
]

/**
 * IP 归属查询端点（按顺序 failover），支持 `{ip}` 与 `{lang}` 占位符（值会被 URL encode）。
 */
export const IP_GEO_ENDPOINTS: readonly string[] = [
  'https://ipinfo.io/{ip}/json',
  'https://api.ip.sb/geoip/{ip}',
  'https://ip-api.com/json/{ip}?fields=query,city,regionName,country,isp,org,as,hosting,mobile,proxy&lang={lang}',
]

/** 本机公网 IP 回显端点（当无法从请求头取得可信 IP 时使用）。 */
export const IP_ECHO_ENDPOINT = 'https://api.ipify.org?format=json'

export function dnsDohEndpoints(): string[] {
  return [...DNS_DOH_ENDPOINTS]
}

export function ipGeoEndpoints(): string[] {
  return [...IP_GEO_ENDPOINTS]
}

export function ipEchoEndpoint(): string {
  return IP_ECHO_ENDPOINT
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
