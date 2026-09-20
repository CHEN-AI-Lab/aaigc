// 埋点上报单测：负载格式统一（SK-6）、默认关闭（Q10）、失败静默、无非空 fallback

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TrackPayload } from 'shared/types/api'

const ENV_KEYS = ['NEXT_PUBLIC_WORKER_URL', 'NEXT_PUBLIC_FALLBACK_URL', 'NEXT_PUBLIC_VERCEL_ENV', 'NODE_ENV'] as const

function okResponse(): Response {
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })
}

describe('buildTrackPayload', () => {
  const saved = new Map<string, string | undefined>()

  beforeEach(() => {
    for (const key of ENV_KEYS) saved.set(key, process.env[key])
  })

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const previous = saved.get(key)
      if (previous === undefined) delete process.env[key]
      else process.env[key] = previous
    }
    saved.clear()
    vi.resetModules()
  })

  it('defaults the project id and derives the event type from tool', async () => {
    const { buildTrackPayload } = await import('shared/api/track')
    const payload = buildTrackPayload({ platform: 'cli', deviceId: 'device-1' })
    expect(payload.project).toBe('aaigc')
    expect(payload.type).toBe('page')
    expect(payload.tool).toBeUndefined()

    const toolPayload = buildTrackPayload({ platform: 'app', deviceId: 'device-1', tool: 'json-formatter' })
    expect(toolPayload.type).toBe('tool')
    expect(toolPayload.tool).toBe('json-formatter')
  })

  it('omits optional userId and locale instead of sending nulls', async () => {
    const { buildTrackPayload } = await import('shared/api/track')
    const payload = buildTrackPayload({ platform: 'desktop', deviceId: 'device-1' }) as Record<string, unknown>
    expect('userId' in payload).toBe(false)
    expect('locale' in payload).toBe(false)
  })

  it('carries userId and locale when provided', async () => {
    const { buildTrackPayload } = await import('shared/api/track')
    const payload = buildTrackPayload({
      platform: 'web',
      deviceId: 'device-1',
      userId: 'user-1',
      locale: 'zh-CN',
    }) as TrackPayload
    expect(payload.userId).toBe('user-1')
    expect(payload.locale).toBe('zh-CN')
  })

  it('reads the environment from VERCEL_ENV then NODE_ENV then development', async () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview'
    const withVercel = await import('shared/api/track')
    expect(withVercel.buildTrackPayload({ platform: 'cli', deviceId: 'd' }).env).toBe('preview')

    vi.resetModules()
    delete process.env.NEXT_PUBLIC_VERCEL_ENV
    process.env.NODE_ENV = 'production'
    const withNodeEnv = await import('shared/api/track')
    expect(withNodeEnv.buildTrackPayload({ platform: 'cli', deviceId: 'd' }).env).toBe('production')

    vi.resetModules()
    delete process.env.NODE_ENV
    const withDefault = await import('shared/api/track')
    expect(withDefault.buildTrackPayload({ platform: 'cli', deviceId: 'd' }).env).toBe('development')
  })

  it('honours an explicit env override', async () => {
    const { buildTrackPayload } = await import('shared/api/track')
    expect(buildTrackPayload({ platform: 'cli', deviceId: 'd', env: 'staging' }).env).toBe('staging')
  })
})

describe('track', () => {
  const saved = new Map<string, string | undefined>()

  beforeEach(() => {
    for (const key of ENV_KEYS) saved.set(key, process.env[key])
    delete process.env.NEXT_PUBLIC_WORKER_URL
    delete process.env.NEXT_PUBLIC_FALLBACK_URL
  })

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const previous = saved.get(key)
      if (previous === undefined) delete process.env[key]
      else process.env[key] = previous
    }
    saved.clear()
    vi.resetModules()
  })

  it('sends nothing when disabled (CLI / desktop default off)', async () => {
    process.env.NEXT_PUBLIC_WORKER_URL = 'https://worker.test'
    const { track } = await import('shared/api/track')
    const fetchImpl = vi.fn(async () => okResponse()) as unknown as typeof fetch
    await expect(track({ platform: 'cli', deviceId: 'd', enabled: false, fetchImpl })).resolves.toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('returns false when no endpoint is configured', async () => {
    const { track } = await import('shared/api/track')
    const fetchImpl = vi.fn(async () => okResponse()) as unknown as typeof fetch
    await expect(track({ platform: 'cli', deviceId: 'd', fetchImpl })).resolves.toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('posts the payload to the worker endpoint', async () => {
    process.env.NEXT_PUBLIC_WORKER_URL = 'https://worker.test'
    const { track } = await import('shared/api/track')
    const fetchImpl = vi.fn(async () => okResponse()) as unknown as typeof fetch
    await expect(track({ platform: 'app', deviceId: 'd', tool: 'base64', fetchImpl })).resolves.toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = (fetchImpl as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0] ?? []
    expect(url).toBe('https://worker.test/track')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toMatchObject({ platform: 'app', tool: 'base64', type: 'tool' })
  })

  it('falls back to the secondary endpoint when the worker fails', async () => {
    process.env.NEXT_PUBLIC_WORKER_URL = 'https://worker.test'
    process.env.NEXT_PUBLIC_FALLBACK_URL = 'https://fallback.test'
    const { track } = await import('shared/api/track')
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.startsWith('https://worker.test')) return new Response('boom', { status: 500 })
      return okResponse()
    }) as unknown as typeof fetch
    await expect(track({ platform: 'desktop', deviceId: 'd', fetchImpl })).resolves.toBe(true)
    expect((fetchImpl as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(2)
  })

  it('swallows network failures so telemetry never breaks the app', async () => {
    process.env.NEXT_PUBLIC_WORKER_URL = 'https://worker.test'
    const { track } = await import('shared/api/track')
    const fetchImpl = vi.fn(async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch
    await expect(track({ platform: 'cli', deviceId: 'd', fetchImpl })).resolves.toBe(false)
  })
})
