// ─────────────────────────────────────────────────────────────────────────────
// API 输入校验（Zod）—— 五端与 Web route 共用，避免各处手写 if 判断
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod'

const GRANT_TYPES = ['email-code', 'password', 'refresh-token', 'device-code'] as const

/** 收藏类型白名单（与 /api/favorites 既有行为保持一致） */
export const FAVORITE_TYPES = ['tool', 'product', 'article', 'snippet'] as const

const isoDateTime = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'invalidTimestamp' })

/** POST /api/auth/token */
export const tokenRequestSchema = z
  .object({
    grantType: z.enum(GRANT_TYPES),
    email: z.string().trim().min(1).max(320).optional(),
    code: z.string().trim().min(1).max(32).optional(),
    password: z.string().min(1).max(200).optional(),
    clientId: z.string().trim().min(1).max(128),
    deviceCode: z.string().trim().min(1).max(128).optional(),
  })
  .strict()

/** POST /api/auth/token/refresh */
export const refreshRequestSchema = z
  .object({
    refreshToken: z.string().trim().min(1).max(512),
    clientId: z.string().trim().min(1).max(128).optional(),
  })
  .strict()

/** POST /api/auth/token/revoke */
export const revokeRequestSchema = z
  .object({
    refreshToken: z.string().trim().min(1).max(512),
  })
  .strict()

/** POST /api/auth/device/code */
export const deviceCodeRequestSchema = z
  .object({
    clientId: z.string().trim().min(1).max(128),
  })
  .strict()

/** POST /api/auth/device/token */
export const deviceTokenRequestSchema = z
  .object({
    deviceCode: z.string().trim().min(1).max(128),
    clientId: z.string().trim().min(1).max(128).optional(),
  })
  .strict()

/** POST /api/auth/weapp/login（P1） */
export const weappLoginRequestSchema = z
  .object({
    code: z.string().trim().min(1).max(256),
    clientId: z.string().trim().min(1).max(128).optional(),
  })
  .strict()

/** POST /api/favorites —— action 显式化后离线队列才能安全重放 */
export const favoritePostSchema = z
  .object({
    toolId: z.string().trim().min(1).max(100),
    type: z.enum(FAVORITE_TYPES).default('tool'),
    action: z.enum(['add', 'remove', 'toggle']).default('toggle'),
  })
  .strict()

export const favoriteMutationSchema = z
  .object({
    opId: z.string().trim().min(1).max(128),
    action: z.enum(['add', 'remove']),
    toolId: z.string().trim().min(1).max(100),
    type: z.enum(['tool', 'product']),
    clientTs: isoDateTime,
  })
  .strict()

/** POST /api/favorites/sync */
export const favoriteSyncSchema = z
  .object({
    ops: z.array(favoriteMutationSchema).max(500),
    lastSyncedAt: isoDateTime.optional(),
  })
  .strict()

/** PATCH /api/user/update */
export const userUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    locale: z.string().trim().min(2).max(16).optional(),
  })
  .strict()

/** GET /api/tools/dns-lookup 查询参数 */
export const dnsLookupQuerySchema = z.object({
  name: z.string().trim().min(1).max(253),
  type: z
    .enum(['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'SRV', 'CAA', 'PTR'])
    .default('A'),
})

export type TokenRequest = z.infer<typeof tokenRequestSchema>
export type RefreshRequest = z.infer<typeof refreshRequestSchema>
export type RevokeRequest = z.infer<typeof revokeRequestSchema>
export type DeviceCodeRequest = z.infer<typeof deviceCodeRequestSchema>
export type DeviceTokenRequest = z.infer<typeof deviceTokenRequestSchema>
export type WeappLoginRequest = z.infer<typeof weappLoginRequestSchema>
export type FavoritePost = z.infer<typeof favoritePostSchema>
export type FavoriteMutationInput = z.infer<typeof favoriteMutationSchema>
export type FavoriteSyncRequest = z.infer<typeof favoriteSyncSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
export type DnsLookupQuery = z.infer<typeof dnsLookupQuerySchema>

/**
 * 安全解析：返回判别联合而非 throw，调用方据此回 `{ error: <ApiErrorCode> }`。
 */
export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: 'invalidParams' }

export function parseOrFail<T>(
  schema: z.ZodType<T>,
  raw: unknown,
): ParseResult<T> {
  const result = schema.safeParse(raw)
  if (!result.success) return { ok: false, error: 'invalidParams' }
  return { ok: true, data: result.data }
}
