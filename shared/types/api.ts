// ─────────────────────────────────────────────────────────────────────────────
// API contract types — 五端共用（参考架构设计 §4.2 / §4.3）
// ─────────────────────────────────────────────────────────────────────────────

import type { Locale } from './index'
import type { ApiErrorCode } from '../constants/error-codes'
import type { Platform, ProjectId } from './platform'

export type { Platform, ProjectId }

/** 鉴权通道：cookie = 浏览器 NextAuth；bearer = 原生端 JWT */
export type AuthMode = 'cookie' | 'bearer'

export interface UserBrief {
  id: string
  email: string | null
  name: string | null
  role: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  /** ISO 8601 UTC */
  expiresAt: string
  user: UserBrief
}

export interface DeviceCodeResponse {
  deviceCode: string
  userCode: string
  verificationUri: string
  expiresIn: number
  interval: number
}

export type GrantType = 'email-code' | 'password' | 'refresh-token' | 'device-code'

export interface FavoriteItemRecord {
  id: string
  toolId: string
  type: string
  createdAt: string
}

export type FavoriteAction = 'add' | 'remove' | 'toggle'

/** 离线队列中的一条操作。opId 为客户端幂等键 */
export interface FavoriteMutation {
  opId: string
  action: 'add' | 'remove'
  toolId: string
  type: 'tool' | 'product'
  /** ISO 8601 UTC */
  clientTs: string
}

export interface FavoriteSnapshot {
  favorites: FavoriteItemRecord[]
  /** ISO 8601 UTC */
  serverTime: string
}

export interface FavoriteSyncResult extends FavoriteSnapshot {
  appliedOpIds: string[]
  skippedOpIds: string[]
}

/** 失败响应体：{ error: <ApiErrorCode> } 形状不可变（Web 端 t(data.error) 直接消费） */
export interface ApiErrorBody {
  error: ApiErrorCode
  errorParams?: Record<string, string | number>
}

export interface TrackPayload {
  project: ProjectId
  platform: Platform
  page?: string
  tool?: string
  type: 'page' | 'tool'
  env: string
  deviceId: string
  userId?: string
  locale?: Locale
}

/** Token 存储抽象：各端（SecureStore / keychain / 0600 文件 / wx.Storage）各自实现 */
export interface TokenStore {
  get(): Promise<TokenPair | null>
  set(pair: TokenPair): Promise<void>
  clear(): Promise<void>
}
