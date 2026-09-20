// 五端共用的请求体校验单测（shared/validators/api.ts）

import { describe, expect, it } from 'vitest'
import {
  FAVORITE_TYPES,
  deviceCodeRequestSchema,
  deviceTokenRequestSchema,
  dnsLookupQuerySchema,
  favoriteMutationSchema,
  favoritePostSchema,
  favoriteSyncSchema,
  parseOrFail,
  refreshRequestSchema,
  revokeRequestSchema,
  tokenRequestSchema,
  userUpdateSchema,
  weappLoginRequestSchema,
} from 'shared/validators/api'

describe('tokenRequestSchema', () => {
  it('accepts the email-code grant', () => {
    const result = parseOrFail(tokenRequestSchema, {
      grantType: 'email-code',
      email: 'ada@example.com',
      code: '123456',
      clientId: 'cli',
    })
    expect(result.ok).toBe(true)
  })

  it('accepts the device-code grant without an email', () => {
    const result = parseOrFail(tokenRequestSchema, { grantType: 'device-code', deviceCode: 'dc-1', clientId: 'cli' })
    expect(result.ok).toBe(true)
  })

  it('rejects an unknown grant type', () => {
    expect(parseOrFail(tokenRequestSchema, { grantType: 'magic-link', clientId: 'cli' })).toEqual({
      ok: false,
      error: 'invalidParams',
    })
  })

  it('rejects a missing clientId', () => {
    expect(parseOrFail(tokenRequestSchema, { grantType: 'password', password: 'x' }).ok).toBe(false)
  })

  it('rejects unknown keys (strict)', () => {
    expect(parseOrFail(tokenRequestSchema, { grantType: 'password', password: 'x', clientId: 'cli', extra: 1 }).ok).toBe(false)
  })
})

describe('refresh / revoke schemas', () => {
  it('requires a refresh token on refresh', () => {
    expect(parseOrFail(refreshRequestSchema, { clientId: 'cli' }).ok).toBe(false)
    expect(parseOrFail(refreshRequestSchema, { refreshToken: 'rt' }).ok).toBe(true)
  })

  it('rejects an over-long refresh token', () => {
    expect(parseOrFail(revokeRequestSchema, { refreshToken: 'r'.repeat(513) }).ok).toBe(false)
  })
})

describe('device flow schemas', () => {
  it('requires clientId for a device code request', () => {
    expect(parseOrFail(deviceCodeRequestSchema, {}).ok).toBe(false)
    expect(parseOrFail(deviceCodeRequestSchema, { clientId: 'desktop' }).ok).toBe(true)
  })

  it('requires deviceCode for a device token exchange', () => {
    expect(parseOrFail(deviceTokenRequestSchema, { clientId: 'desktop' }).ok).toBe(false)
    expect(parseOrFail(deviceTokenRequestSchema, { deviceCode: 'dc' }).ok).toBe(true)
  })

  it('requires code for weapp login', () => {
    expect(parseOrFail(weappLoginRequestSchema, {}).ok).toBe(false)
    expect(parseOrFail(weappLoginRequestSchema, { code: 'wx-code' }).ok).toBe(true)
  })
})

describe('favoritePostSchema', () => {
  it('defaults to tool/toggle for backwards compatibility', () => {
    const result = parseOrFail(favoritePostSchema, { toolId: 'json-formatter' })
    expect(result).toEqual({ ok: true, data: { toolId: 'json-formatter', type: 'tool', action: 'toggle' } })
  })

  it('accepts explicit add/remove so replay is idempotent', () => {
    expect(parseOrFail(favoritePostSchema, { toolId: 'x', action: 'add' })).toEqual({
      ok: true,
      data: { toolId: 'x', type: 'tool', action: 'add' },
    })
    expect(parseOrFail(favoritePostSchema, { toolId: 'x', action: 'remove' }).ok).toBe(true)
  })

  it('rejects an unknown action or type', () => {
    expect(parseOrFail(favoritePostSchema, { toolId: 'x', action: 'upsert' }).ok).toBe(false)
    expect(parseOrFail(favoritePostSchema, { toolId: 'x', type: 'video' }).ok).toBe(false)
  })

  it('rejects an empty toolId', () => {
    expect(parseOrFail(favoritePostSchema, { toolId: '   ' }).ok).toBe(false)
  })

  it('exposes the favorite type whitelist', () => {
    expect(FAVORITE_TYPES).toEqual(['tool', 'product', 'article', 'snippet'])
  })
})

describe('favoriteSyncSchema', () => {
  const op = { opId: 'op-1', action: 'add', toolId: 'x', type: 'tool', clientTs: '2025-05-01T00:00:00.000Z' }

  it('accepts a well formed queue', () => {
    expect(parseOrFail(favoriteSyncSchema, { ops: [op], lastSyncedAt: '2025-04-01T00:00:00.000Z' }).ok).toBe(true)
  })

  it('accepts an empty queue', () => {
    expect(parseOrFail(favoriteSyncSchema, { ops: [] }).ok).toBe(true)
  })

  it('rejects a queue above the 500 op cap', () => {
    const ops = Array.from({ length: 501 }, (_unused, index) => ({ ...op, opId: `op-${index}` }))
    expect(parseOrFail(favoriteSyncSchema, { ops }).ok).toBe(false)
  })

  it('rejects a malformed timestamp', () => {
    expect(parseOrFail(favoriteMutationSchema, { ...op, clientTs: 'yesterday' }).ok).toBe(false)
  })

  it('rejects a mutation without an opId', () => {
    expect(parseOrFail(favoriteMutationSchema, { ...op, opId: '' }).ok).toBe(false)
  })
})

describe('userUpdateSchema / dnsLookupQuerySchema', () => {
  it('accepts partial updates and rejects unknown keys', () => {
    expect(parseOrFail(userUpdateSchema, { name: 'Ada' }).ok).toBe(true)
    expect(parseOrFail(userUpdateSchema, { locale: 'zh-CN' }).ok).toBe(true)
    expect(parseOrFail(userUpdateSchema, { role: 'admin' }).ok).toBe(false)
  })

  it('rejects an over-long name', () => {
    expect(parseOrFail(userUpdateSchema, { name: 'n'.repeat(61) }).ok).toBe(false)
  })

  it('defaults the dns query type to A and validates the record type', () => {
    expect(parseOrFail(dnsLookupQuerySchema, { name: 'example.com' })).toEqual({
      ok: true,
      data: { name: 'example.com', type: 'A' },
    })
    expect(parseOrFail(dnsLookupQuerySchema, { name: 'example.com', type: 'MX' }).ok).toBe(true)
    expect(parseOrFail(dnsLookupQuerySchema, { name: 'example.com', type: 'SPF' }).ok).toBe(false)
  })

  it('rejects an over-long domain', () => {
    expect(parseOrFail(dnsLookupQuerySchema, { name: 'a'.repeat(254) }).ok).toBe(false)
  })
})

describe('parseOrFail', () => {
  it('returns a discriminated union instead of throwing', () => {
    const ok = parseOrFail(userUpdateSchema, { name: 'Ada' })
    const bad = parseOrFail(userUpdateSchema, { name: 42 })
    expect(ok.ok).toBe(true)
    expect(bad).toEqual({ ok: false, error: 'invalidParams' })
  })
})
