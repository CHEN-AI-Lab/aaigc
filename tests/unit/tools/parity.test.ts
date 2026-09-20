// 双源一致性门禁（架构 §2.5 防漂移三件套之 3）
// 同一份 fixture 分别喂给 TS 源与 esbuild 产物 shared.mjs，断言输出深度相等。

import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getTool, runToolById } from 'shared/tools/registry'
import { contextFromFixture, loadAllFixtures } from './helpers'

const MJS_PATH = path.resolve(__dirname, '../../../shared/js/shared.mjs')
const mjsPromise = import(pathToFileURL(MJS_PATH).href) as Promise<{
  runToolById: (
    id: string,
    raw: Record<string, unknown>,
    ctx: unknown,
  ) => Promise<{ ok: boolean; data?: unknown; error?: unknown }>
}>

describe('shared.mjs ↔ shared/tools parity', () => {
  const fixtures = loadAllFixtures()

  it('should have one fixture per tool (38)', () => {
    expect(fixtures.length).toBe(38)
  })

  it('every fixture id resolves in the TS registry', () => {
    for (const fixture of fixtures) {
      expect(getTool(fixture.toolId), fixture.toolId).toBeDefined()
    }
  })

  for (const fixture of fixtures) {
    it(`${fixture.toolId}: TS source and shared.mjs produce identical output`, async () => {
      const mjs = await mjsPromise

      const ctxTs = contextFromFixture(fixture)
      const ctxMjs = contextFromFixture(fixture)

      const fromTs = await runToolById(fixture.toolId, fixture.input, ctxTs)
      const fromMjs = await mjs.runToolById(fixture.toolId, fixture.input, ctxMjs)

      expect(fromMjs).toEqual(fromTs)

      // T1/T2 工具在 fixture 上必须成功；T3 工具依赖网络，离线时允许以确定的
      // 错误码失败，但两源的错误必须完全一致（已在上面 toEqual 断言）。
      const tool = getTool(fixture.toolId)
      if (tool && !tool.capabilities.includes('network')) {
        expect(fromMjs.ok, `${fixture.toolId} should succeed on its fixture`).toBe(true)
      } else {
        expect(fromMjs.ok).toBe(false)
        expect(fromTs.ok).toBe(false)
      }
    })
  }

  it('render() output is identical across both sources', async () => {
    const mjs = (await mjsPromise) as unknown as {
      getTool: (id: string) => {
        parse: (raw: Record<string, unknown>, ctx: unknown) => { ok: boolean; data?: unknown; error?: unknown }
        run: (input: unknown, ctx: unknown) => { ok: boolean; data?: unknown; error?: unknown }
        render: (out: unknown, ctx: unknown) => string
      }
    }
    for (const fixture of fixtures) {
      const ctxA = contextFromFixture(fixture)
      const ctxB = contextFromFixture(fixture)

      const toolTs = getTool(fixture.toolId)
      const toolMjs = mjs.getTool(fixture.toolId)
      expect(toolTs, fixture.toolId).toBeDefined()
      expect(toolMjs, fixture.toolId).toBeDefined()

      const parsedA = toolTs!.parse(fixture.input, ctxA)
      const parsedB = toolMjs.parse(fixture.input, ctxB)
      expect(parsedB).toEqual(parsedA)
      if (!parsedA.ok || !parsedB.ok) continue

      const runA = await toolTs!.run(parsedA.data, ctxA)
      const runB = await toolMjs.run(parsedB.data, ctxB)
      expect(runB).toEqual(runA)
      if (!runA.ok || !runB.ok) continue

      expect(toolMjs.render(runB.data, ctxB)).toBe(toolTs!.render(runA.data, ctxA))
    }
  })
})
