// ─────────────────────────────────────────────────────────────────────────────
// 端（platform）与项目（project）维度 —— 埋点与鉴权共用
// ─────────────────────────────────────────────────────────────────────────────

export const PLATFORMS = ['web', 'weapp', 'app', 'desktop', 'cli'] as const
export type Platform = (typeof PLATFORMS)[number]

export const PROJECT_IDS = ['aaigc'] as const
export type ProjectId = (typeof PROJECT_IDS)[number]

export const DEFAULT_PROJECT_ID: ProjectId = 'aaigc'

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value)
}

export function isProjectId(value: string): value is ProjectId {
  return (PROJECT_IDS as readonly string[]).includes(value)
}
