// ─────────────────────────────────────────────────────────────────────────────
// weapp 专属构建期常量 —— env 的唯一出口
//
// 小程序**没有** `process` 对象，任何 `process.env.X` 都会在运行期变成 undefined。
//
// ⚠️ 为什么不用 `defineConstants: { 'process.env.FOO': ... }` 直接修 shared：
//   实测（spike 结论）defineConstants 是**字面量文本替换**，只对静态写死的
//   `process.env.FOO` 生效。shared/constants/{domains,endpoints}.ts 用的是
//   `readEnv(name) { process.env[name] }`（动态下标），替换不到，产物里会原样
//   残留 `process.env[e]`。
//   所以这里不依赖 defineConstants 去改 shared，而是由 config/index.ts 注入一个
//   weapp 专属全局常量 `__AAIGC_WEAPP_ENV__`，本文件是它**唯一**的读取出口。
//
// SK-8：未配置就是未配置 —— 不提供非空 fallback，调用方拿到明确错误。
// 安全：小程序产物是公开的，这里只允许放公开配置，**禁止放任何密钥**。
// ─────────────────────────────────────────────────────────────────────────────

declare const __AAIGC_WEAPP_ENV__: WeappBuildEnv | undefined

export interface WeappBuildEnv {
  /** API 基址，末尾无斜杠；未配置为空串 */
  apiBaseUrl: string
  /** Bearer 通道 clientId；未配置为空串 */
  clientId: string
  /** 构建环境标识（埋点用） */
  env: string
}

const EMPTY_ENV: WeappBuildEnv = { apiBaseUrl: '', clientId: '', env: 'production' }

/** 读取构建期常量。缺失说明 config/index.ts 的 defineConstants 没生效 —— 明确抛错。 */
function readBuildEnv(): WeappBuildEnv {
  if (typeof __AAIGC_WEAPP_ENV__ === 'undefined' || __AAIGC_WEAPP_ENV__ === null) {
    throw new Error(
      '构建期常量 __AAIGC_WEAPP_ENV__ 缺失：apps/weapp/config/index.ts 的 defineConstants 未生效。',
    )
  }
  return __AAIGC_WEAPP_ENV__
}

function safeReadBuildEnv(): WeappBuildEnv {
  try {
    return readBuildEnv()
  } catch {
    return EMPTY_ENV
  }
}

/** API 基址是否已配置（"配没配"本身就是语义，不能被默认值吃掉） */
export function isApiBaseUrlConfigured(): boolean {
  return safeReadBuildEnv().apiBaseUrl.length > 0
}

/**
 * API 基址（末尾无斜杠）。
 * 未配置时**抛错**，不返回空串、不回落任何默认域名（SK-8：禁止非空 fallback）。
 */
export function apiBaseUrl(): string {
  const value = readBuildEnv().apiBaseUrl
  if (value.length === 0) {
    throw new Error(
      '未配置 API 基址。请以 WEAPP_API_BASE_URL=<https://your-domain> 重新构建小程序（SK-8：不提供默认域名）。',
    )
  }
  return value
}

/** Bearer 通道 clientId。未配置时抛错（服务端 /api/auth/token 必填且不接受空串）。 */
export function clientId(): string {
  const value = readBuildEnv().clientId
  if (value.length === 0) {
    throw new Error(
      '未配置 WEAPP_CLIENT_ID。Bearer 通道换取 token 时该字段必填，且服务端会返回 missingClientId。',
    )
  }
  return value
}

export function buildEnv(): string {
  return safeReadBuildEnv().env
}
