// ─────────────────────────────────────────────────────────────────────────────
// 埋点的 project / platform 维度（SK-6：禁止硬编码字符串）
// ─────────────────────────────────────────────────────────────────────────────

import { PLATFORMS, PROJECT_IDS, DEFAULT_PROJECT_ID } from '../types/platform'

export { PLATFORMS, PROJECT_IDS, DEFAULT_PROJECT_ID }

export type { Platform, ProjectId } from '../types/platform'

/** 需要 CORS 白名单的端（浏览器 WebView 会携带 Origin） */
export const CORS_PLATFORMS: readonly string[] = ['desktop', 'app']

/** 默认关闭埋点的端（CLI / 桌面端，Q10） */
export const TELEMETRY_OFF_BY_DEFAULT_PLATFORMS: readonly string[] = ['cli', 'desktop']
