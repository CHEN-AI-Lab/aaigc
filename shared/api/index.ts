// ─────────────────────────────────────────────────────────────────────────────
// 多端 API 层 barrel（CLI / 小程序 / App / 桌面 / Web 共用）
//
// 收录原则：**只收敛「import 期无副作用」的模块**，避免 barrel 把环境依赖拖进
// Edge Runtime / 小程序包体（barrel 一旦被引用，其下所有模块都会被求值）：
//   ✅ http-client —— 纯逻辑，只读 types / error-codes 常量
//   ✅ favorites   —— 纯逻辑，只依赖 http-client + favorite-sync
//   ✅ track       —— 埋点负载构造；env 读取在函数体内惰性执行，不在模块加载期求值
//   ❌ ranking     —— 模块顶层 `const env = getEnv()` 固化 env 快照（import 期副作用），
//                     且是 Web 专用遗留实现；保持显式路径导入：shared/api/ranking
// ─────────────────────────────────────────────────────────────────────────────

export { ApiError, createApiClient } from './http-client'
export type { ApiClient, ApiClientOptions } from './http-client'

export { createFavoritesApi, favoriteSet } from './favorites'
export type { FavoritesApi } from './favorites'

export { buildTrackPayload, track } from './track'
export type { TrackOptions } from './track'
