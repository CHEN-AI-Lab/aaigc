export { locales, defaultLocale, isLocale, localeNames } from './locales'

// Cloudflare Worker 统计网关地址
// 所有项目的统计请求通过此 Worker 发送到 Upstash Redis
// 生产环境可通过 NEXT_PUBLIC_WORKER_URL 环境变量覆盖
export const WORKER_URL: string =
  (typeof process !== 'undefined' &&
    (process as any).env?.NEXT_PUBLIC_WORKER_URL) ||
  'https://stats.aaigc.workers.dev'

// Fallback tracking endpoint for users who cannot reach the Worker (e.g. China)
// Sends tracking data directly to the stats-dashboard API.
// Must be set via NEXT_PUBLIC_FALLBACK_URL env var — no hardcoded default.
export const FALLBACK_URL =
  (typeof process !== 'undefined' &&
    (process as any).env?.NEXT_PUBLIC_FALLBACK_URL) || ''