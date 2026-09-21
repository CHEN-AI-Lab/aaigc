import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import type { ToolContext } from 'shared/types/tool'

export interface ToolFixture {
  toolId: string
  context: {
    now: number
    timezone: string
    locale: string
    /** 可选：确定性随机字节序列（0–255） */
    randomBytes?: number[]
  }
  input: Record<string, unknown>
}

export const FIXTURE_DIR = path.resolve(__dirname, '../../fixtures/tools')

export function fixtureFiles(): string[] {
  return readdirSync(FIXTURE_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
}

export function loadFixture(file: string): ToolFixture {
  return JSON.parse(readFileSync(path.join(FIXTURE_DIR, file), 'utf8')) as ToolFixture
}

export function loadAllFixtures(): ToolFixture[] {
  return fixtureFiles().map(loadFixture)
}

/**
 * 由 fixture 构造确定性的 ToolContext。
 * 随机源使用 fixture 提供的字节序列（循环取用），因此跨端、跨运行时的结果必须逐字节一致。
 *
 * 注：此前这里写「TS 源与 shared.mjs 必须一致」。shared.mjs 已于 2026-09-21 删除（T01.3 取消），
 * 现在的一致性由 purity.test.ts（不碰平台 API）与各端共用同一份 TS 源码来保证。
 */
export function contextFromFixture(fixture: ToolFixture): ToolContext {
  const seed = fixture.context.randomBytes ?? defaultSeed()
  let cursor = 0
  return {
    locale: fixture.context.locale,
    timezone: fixture.context.timezone,
    now: () => fixture.context.now,
    randomBytes: (length: number): Uint8Array => {
      const out = new Uint8Array(length)
      for (let i = 0; i < length; i++) {
        out[i] = seed[cursor % seed.length]
        cursor += 1
      }
      return out
    },
  }
}

/** 稳定的伪随机字节序列（确定性，跨运行一致） */
export function defaultSeed(): number[] {
  const seed: number[] = []
  let state = 0x2545f491
  for (let i = 0; i < 512; i++) {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    seed.push(state & 0xff)
  }
  return seed
}
