export { locales, defaultLocale, isLocale, localeNames } from './locales'

export {
  API_ERROR_CODES,
  LEGACY_API_ERROR_CODES,
  MULTI_CLIENT_API_ERROR_CODES,
  API_ERROR_STATUS,
  isApiErrorCode,
  apiErrorBody,
  statusForErrorCode,
  TOOL_ERROR_CODES,
} from './error-codes'
export type { ApiErrorCode, ToolErrorCodeValue } from './error-codes'

export {
  PLATFORMS,
  PROJECT_IDS,
  DEFAULT_PROJECT_ID,
  CORS_PLATFORMS,
  TELEMETRY_OFF_BY_DEFAULT_PLATFORMS,
} from './projects'
export type { Platform, ProjectId } from './projects'

export {
  THEME_COLOR_NAMES,
  THEME_CSS_VARIABLES,
  LIGHT_THEME_TOKENS,
  THEME_MODES,
  DEFAULT_THEME_MODE,
  themeCssDeclarations,
  THEME_ANSI,
} from './theme'
export type { ThemeColorName, ThemeMode } from './theme'

export {
  dnsDohEndpoints,
  ipGeoEndpoints,
  ipEchoEndpoint,
  oauthRevokeEndpoints,
  corsOrigins,
  apiCorsOrigins,
  nativeAppDownloadUrls,
  productUrlMap,
} from './endpoints'
export type { ProductUrlEntry } from './endpoints'

// ── 本站域名（唯一真源）── 见 shared/constants/domains.ts ──
// 任何地方都不要再写死本站域名，一律从这里取。
export {
  PUBLIC_SITE_DOMAIN,
  PUBLIC_SITE_ORIGIN,
  STATS_SITE_ORIGIN,
  STATS_PREVIEW_SITE_ORIGIN,
  CONTACT_EMAIL,
  siteOrigin,
  isSiteOriginConfigured,
} from './domains'

// 发件人显示名 — 各项目在各自代码中维护自己的品牌名。
// MAIL_FROM 环境变量只配纯邮箱地址（如 noreply@aaigc.online），所有项目统一同一个值。
export const SENDER_NAME = 'AAIGC'

// Cloudflare Worker 统计网关地址
// 所有项目的统计请求通过此 Worker 发送到 Turso (libSQL) 数据库
// 生产环境可通过 NEXT_PUBLIC_WORKER_URL 环境变量覆盖
export const WORKER_URL: string =
  (typeof process !== 'undefined' &&
    process.env?.NEXT_PUBLIC_WORKER_URL) || ''
// Must be set via NEXT_PUBLIC_WORKER_URL env var — no hardcoded default.

// Fallback tracking endpoint for users who cannot reach the Worker (e.g. China)
// Sends tracking data directly to the stats-dashboard API.
// Must be set via NEXT_PUBLIC_FALLBACK_URL env var — no hardcoded default.
export const FALLBACK_URL =
  (typeof process !== 'undefined' &&
    process.env?.NEXT_PUBLIC_FALLBACK_URL) || ''
