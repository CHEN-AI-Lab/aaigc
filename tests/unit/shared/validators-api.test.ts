// shared/validators/api.test.ts —— Zod schema 输入校验测试
//
// 覆盖：
//   1. tokenRequestSchema: 4 种 grantType + 必填 clientId + strict（多余字段拒绝）
//   2. refreshRequestSchema + revokeRequestSchema + deviceCode/Token
//   3. favoritePostSchema: 默认值、type 白名单、action 白名单
//   4. favoriteMutationSchema: 必填 opId/clientTs、strict
//   5. favoriteSyncSchema: ops 数组上限 500、lastSyncedAt 可选
//   6. userUpdateSchema: 长度边界、locale 格式
//   7. dnsLookupQuerySchema: type 默认值、白名单
//   8. parseOrFail: 成功 → ok；失败 → ok:false error

import { describe, it, expect } from 'vitest'
import {
  tokenRequestSchema,
  refreshRequestSchema,
  revokeRequestSchema,
  deviceCodeRequestSchema,
  deviceTokenRequestSchema,
  weappLoginRequestSchema,
  favoritePostSchema,
  favoriteMutationSchema,
  favoriteSyncSchema,
  userUpdateSchema,
  dnsLookupQuerySchema,
  parseOrFail,
} from 'shared/validators/api'

describe('tokenRequestSchema', () => {
  it('accepts email-code grant with email + code', () => {
    const r = tokenRequestSchema.safeParse({
      grantType: 'email-code',
      email: 'user@example.com',
      code: '123456',
      clientId: 'aaigc-app',
    })
    expect(r.success).toBe(true)
  })

  it('accepts password grant with email + password', () => {
    const r = tokenRequestSchema.safeParse({
      grantType: 'password',
      email: 'user@example.com',
      password: 'correct horse battery',
      clientId: 'aaigc-app',
    })
    expect(r.success).toBe(true)
  })

  it('accepts refresh-token grant with no email', () => {
    const r = tokenRequestSchema.safeParse({
      grantType: 'refresh-token',
      clientId: 'aaigc-app',
    })
    expect(r.success).toBe(true)
  })

  it('accepts device-code grant with deviceCode', () => {
    const r = tokenRequestSchema.safeParse({
      grantType: 'device-code',
      deviceCode: 'dev_abc123',
      clientId: 'aaigc-app',
    })
    expect(r.success).toBe(true)
  })

  it('rejects unknown grantType', () => {
    const r = tokenRequestSchema.safeParse({
      grantType: 'magic-link',
      clientId: 'aaigc-app',
    })
    expect(r.success).toBe(false)
  })

  it('rejects empty clientId', () => {
    const r = tokenRequestSchema.safeParse({
      grantType: 'email-code',
      email: 'user@example.com',
      code: '123456',
      clientId: '   ',
    })
    expect(r.success).toBe(false)
  })

  it('rejects clientId exceeding 128 chars', () => {
    const r = tokenRequestSchema.safeParse({
      grantType: 'email-code',
      clientId: 'a'.repeat(129),
    })
    expect(r.success).toBe(false)
  })

  it('rejects extra unknown fields (strict mode)', () => {
    const r = tokenRequestSchema.safeParse({
      grantType: 'email-code',
      clientId: 'aaigc-app',
      backdoor: true,
    })
    expect(r.success).toBe(false)
  })

  it('trims whitespace on string fields', () => {
    const r = tokenRequestSchema.safeParse({
      grantType: 'email-code',
      email: '  user@example.com  ',
      code: ' 123456 ',
      clientId: ' aaigc-app ',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.email).toBe('user@example.com')
      expect(r.data.code).toBe('123456')
      expect(r.data.clientId).toBe('aaigc-app')
    }
  })
})

describe('refreshRequestSchema', () => {
  it('requires refreshToken', () => {
    const r = refreshRequestSchema.safeParse({})
    expect(r.success).toBe(false)
  })

  it('rejects refreshToken > 512 chars', () => {
    const r = refreshRequestSchema.safeParse({ refreshToken: 'a'.repeat(513) })
    expect(r.success).toBe(false)
  })

  it('accepts with optional clientId', () => {
    const r = refreshRequestSchema.safeParse({
      refreshToken: 'rt_abc',
      clientId: 'aaigc-app',
    })
    expect(r.success).toBe(true)
  })
})

describe('revokeRequestSchema', () => {
  it('requires refreshToken, no clientId', () => {
    const r = revokeRequestSchema.safeParse({ refreshToken: 'rt_abc' })
    expect(r.success).toBe(true)
  })

  it('rejects extra clientId (strict)', () => {
    const r = revokeRequestSchema.safeParse({
      refreshToken: 'rt_abc',
      clientId: 'aaigc-app',
    })
    expect(r.success).toBe(false)
  })
})

describe('deviceCodeRequestSchema', () => {
  it('requires clientId', () => {
    const r = deviceCodeRequestSchema.safeParse({})
    expect(r.success).toBe(false)
  })
})

describe('deviceTokenRequestSchema', () => {
  it('requires deviceCode', () => {
    const r = deviceTokenRequestSchema.safeParse({ clientId: 'aaigc-app' })
    expect(r.success).toBe(false)
  })

  it('accepts with optional clientId', () => {
    const r = deviceTokenRequestSchema.safeParse({
      deviceCode: 'dev_abc',
      clientId: 'aaigc-app',
    })
    expect(r.success).toBe(true)
  })
})

describe('weappLoginRequestSchema', () => {
  it('requires code', () => {
    const r = weappLoginRequestSchema.safeParse({})
    expect(r.success).toBe(false)
  })

  it('rejects code > 256 chars', () => {
    const r = weappLoginRequestSchema.safeParse({ code: 'a'.repeat(257) })
    expect(r.success).toBe(false)
  })
})

describe('favoritePostSchema', () => {
  it('applies defaults: type=tool, action=toggle', () => {
    const r = favoritePostSchema.safeParse({ toolId: 'json-formatter' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.type).toBe('tool')
      expect(r.data.action).toBe('toggle')
    }
  })

  it('rejects unknown type', () => {
    const r = favoritePostSchema.safeParse({
      toolId: 'json-formatter',
      type: 'unknown',
      action: 'add',
    })
    expect(r.success).toBe(false)
  })

  it('accepts all FAVORITE_TYPES', () => {
    for (const type of ['tool', 'product', 'article', 'snippet'] as const) {
      const r = favoritePostSchema.safeParse({ toolId: 'x', type, action: 'add' })
      expect(r.success).toBe(true)
    }
  })

  it('accepts all action values', () => {
    for (const action of ['add', 'remove', 'toggle'] as const) {
      const r = favoritePostSchema.safeParse({ toolId: 'x', action })
      expect(r.success).toBe(true)
    }
  })

  it('rejects toolId > 100 chars', () => {
    const r = favoritePostSchema.safeParse({ toolId: 'a'.repeat(101) })
    expect(r.success).toBe(false)
  })
})

describe('favoriteMutationSchema', () => {
  const valid = {
    opId: 'op_1',
    action: 'add' as const,
    toolId: 'json-formatter',
    type: 'tool' as const,
    clientTs: '2026-10-02T00:00:00Z',
  }

  it('accepts complete input', () => {
    expect(favoriteMutationSchema.safeParse(valid).success).toBe(true)
  })

  it('requires opId', () => {
    const r = favoriteMutationSchema.safeParse({ ...valid, opId: undefined })
    expect(r.success).toBe(false)
  })

  it('rejects non-ISO clientTs', () => {
    const r = favoriteMutationSchema.safeParse({ ...valid, clientTs: 'not-a-date' })
    expect(r.success).toBe(false)
  })

  it('accepts valid ISO 8601 variants', () => {
    expect(favoriteMutationSchema.safeParse({ ...valid, clientTs: '2026-10-02' }).success).toBe(true)
    expect(favoriteMutationSchema.safeParse({ ...valid, clientTs: '2026-10-02T00:00:00+08:00' }).success).toBe(true)
  })

  it('only allows add/remove (no toggle)', () => {
    expect(favoriteMutationSchema.safeParse({ ...valid, action: 'toggle' }).success).toBe(false)
  })

  it('only allows tool/product (no article/snippet)', () => {
    expect(favoriteMutationSchema.safeParse({ ...valid, type: 'article' }).success).toBe(false)
    expect(favoriteMutationSchema.safeParse({ ...valid, type: 'snippet' }).success).toBe(false)
  })
})

describe('favoriteSyncSchema', () => {
  it('accepts empty ops array', () => {
    const r = favoriteSyncSchema.safeParse({ ops: [] })
    expect(r.success).toBe(true)
  })

  it('rejects ops > 500 items', () => {
    const ops = Array.from({ length: 501 }, (_, i) => ({
      opId: `op_${i}`,
      action: 'add' as const,
      toolId: 'x',
      type: 'tool' as const,
      clientTs: '2026-10-02T00:00:00Z',
    }))
    const r = favoriteSyncSchema.safeParse({ ops })
    expect(r.success).toBe(false)
  })

  it('accepts optional lastSyncedAt', () => {
    const r = favoriteSyncSchema.safeParse({
      ops: [],
      lastSyncedAt: '2026-10-01T00:00:00Z',
    })
    expect(r.success).toBe(true)
  })

  it('rejects invalid lastSyncedAt', () => {
    const r = favoriteSyncSchema.safeParse({
      ops: [],
      lastSyncedAt: 'tomorrow',
    })
    expect(r.success).toBe(false)
  })
})

describe('userUpdateSchema', () => {
  it('accepts name only', () => {
    expect(userUpdateSchema.safeParse({ name: 'Alice' }).success).toBe(true)
  })

  it('accepts locale only', () => {
    expect(userUpdateSchema.safeParse({ locale: 'zh-CN' }).success).toBe(true)
  })

  it('rejects name > 60 chars', () => {
    expect(userUpdateSchema.safeParse({ name: 'a'.repeat(61) }).success).toBe(false)
  })

  it('rejects locale < 2 chars', () => {
    expect(userUpdateSchema.safeParse({ locale: 'x' }).success).toBe(false)
  })

  it('rejects locale > 16 chars', () => {
    expect(userUpdateSchema.safeParse({ locale: 'a'.repeat(17) }).success).toBe(false)
  })
})

describe('dnsLookupQuerySchema', () => {
  it('defaults type to A', () => {
    const r = dnsLookupQuerySchema.safeParse({ name: 'example.com' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.type).toBe('A')
  })

  it('accepts all DNS record types', () => {
    for (const type of ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'SRV', 'CAA', 'PTR'] as const) {
      const r = dnsLookupQuerySchema.safeParse({ name: 'example.com', type })
      expect(r.success).toBe(true)
    }
  })

  it('rejects unknown record type', () => {
    const r = dnsLookupQuerySchema.safeParse({ name: 'example.com', type: 'BOGUS' })
    expect(r.success).toBe(false)
  })

  it('rejects empty name', () => {
    expect(dnsLookupQuerySchema.safeParse({ name: '' }).success).toBe(false)
  })
})

describe('parseOrFail', () => {
  it('returns ok:true with data on valid input', () => {
    const result = parseOrFail(tokenRequestSchema, {
      grantType: 'email-code',
      clientId: 'aaigc-app',
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.grantType).toBe('email-code')
  })

  it('returns ok:false with error:invalidParams on invalid input', () => {
    const result = parseOrFail(tokenRequestSchema, { grantType: 'magic' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('invalidParams')
  })

  it('does not throw on completely malformed input', () => {
    expect(() => parseOrFail(tokenRequestSchema, null)).not.toThrow()
    expect(() => parseOrFail(tokenRequestSchema, 'string')).not.toThrow()
    expect(() => parseOrFail(tokenRequestSchema, undefined)).not.toThrow()
  })
})
