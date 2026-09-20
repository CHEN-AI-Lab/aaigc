// ─────────────────────────────────────────────────────────────────────────────
// Bearer 凭证存储 —— expo-secure-store（Keychain / Android Keystore）
//
// 为什么不用 AsyncStorage：AsyncStorage 是明文 SQLite / SharedPreferences，
// root 或越狱设备可直接读出 refresh token（30 天有效、可换新 access token）。
// 只有"非机密"的偏好（语言、clientId、收藏缓存）才走 AsyncStorage。
//
// 读取一律「校验后使用」：被截断 / 被改坏 / 结构不认识，都按"未登录"处理并
// 清掉脏数据 —— 不猜、不修补、不把坏凭证当成有效会话。
// ─────────────────────────────────────────────────────────────────────────────

import * as SecureStore from 'expo-secure-store'
import type { TokenPair, TokenStore, UserBrief } from 'shared/types/api'

/** 单个 SecureStore 条目；带版本号，未来改结构时可以并存而不是静默误读 */
export const TOKEN_STORAGE_KEY = 'aaigc.token-pair.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseUserBrief(raw: unknown): UserBrief | null {
  if (!isRecord(raw)) return null
  const { id, email, name, role } = raw
  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof role !== 'string' || role.length === 0) return null
  if (email !== null && typeof email !== 'string') return null
  if (name !== null && typeof name !== 'string') return null
  return { id, email, name, role }
}

/** 逐字段校验；任何一处不符合 TokenPair 契约就返回 null（= 视为未登录） */
export function parseTokenPair(raw: unknown): TokenPair | null {
  if (!isRecord(raw)) return null
  const { accessToken, refreshToken, tokenType, expiresAt } = raw
  if (typeof accessToken !== 'string' || accessToken.length === 0) return null
  if (typeof refreshToken !== 'string' || refreshToken.length === 0) return null
  if (tokenType !== 'Bearer') return null
  if (typeof expiresAt !== 'string' || Number.isNaN(Date.parse(expiresAt))) return null
  const user = parseUserBrief(raw.user)
  if (!user) return null
  return { accessToken, refreshToken, tokenType: 'Bearer', expiresAt, user }
}

export interface SecureTokenStore extends TokenStore {
  /** 与 get() 同源；登出时需要 refreshToken 原文去调 revoke */
  read(): Promise<TokenPair | null>
}

export function createSecureTokenStore(): SecureTokenStore {
  async function read(): Promise<TokenPair | null> {
    let raw: string | null
    try {
      raw = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY)
    } catch {
      // 钥匙串不可用（如未设置设备锁的旧 Android）——按未登录处理，登录时会再报错
      return null
    }
    if (raw === null) return null

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY).catch(() => undefined)
      return null
    }

    const pair = parseTokenPair(parsed)
    if (!pair) {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY).catch(() => undefined)
      return null
    }
    return pair
  }

  return {
    read,

    async get(): Promise<TokenPair | null> {
      return read()
    },

    async set(pair: TokenPair): Promise<void> {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, JSON.stringify(pair))
    },

    async clear(): Promise<void> {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY)
    },
  }
}
