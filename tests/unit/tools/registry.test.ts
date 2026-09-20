import { describe, expect, it } from 'vitest'
import { TOOL_IDS } from 'shared/types/tool'
import { TOOL_REGISTRY, getTool, isToolId, listTools, runToolById, supportedTools } from 'shared/tools/registry'
import { tools } from 'shared/data/tools'
import type { ToolContext } from 'shared/types/tool'

function ctx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    locale: 'en',
    timezone: 'UTC',
    now: () => 1700000000000,
    randomBytes: (length: number) => new Uint8Array(length).fill(7),
    ...overrides,
  }
}

describe('tool registry', () => {
  it('registers all 38 tool ids', () => {
    expect(TOOL_IDS.length).toBe(38)
    for (const id of TOOL_IDS) {
      expect(TOOL_REGISTRY[id], id).toBeDefined()
      expect(TOOL_REGISTRY[id].id).toBe(id)
    }
  })

  it('registry ids match data/tools.ts metadata ids (no drift)', () => {
    const metaIds = new Set(tools.map((tool) => tool.id))
    expect(metaIds.size).toBe(38)
    for (const id of TOOL_IDS) {
      expect(metaIds.has(id as string), id).toBe(true)
    }
  })

  it('getTool rejects unknown ids', () => {
    expect(getTool('nope')).toBeUndefined()
    expect(isToolId('nope')).toBe(false)
    expect(isToolId('json-formatter')).toBe(true)
  })

  it('listTools filters by tier', () => {
    const t1 = listTools({ tier: 'T1' })
    expect(t1.length).toBeGreaterThan(20)
    expect(t1.every((tool) => tool.tier === 'T1')).toBe(true)
  })

  it('listTools filters by capabilities', () => {
    const network = listTools({ capabilities: ['network'] })
    expect(network.map((t) => t.id).sort()).toEqual(['dns-lookup', 'ip-lookup'])
  })

  it('supportedTools excludes tools needing missing capabilities', () => {
    const offline = supportedTools([])
    expect(offline.length).toBeGreaterThanOrEqual(26)
    expect(offline.some((t) => t.id === 'ip-lookup')).toBe(false)
    expect(offline.some((t) => t.id === 'json-formatter')).toBe(true)
  })

  it('runToolById returns toolNotFound for unknown ids', async () => {
    const result = await runToolById('nope', {}, ctx())
    expect(result.ok).toBe(false)
  })

  it('every declared input field has a labelKey', () => {
    for (const id of TOOL_IDS) {
      for (const field of TOOL_REGISTRY[id].inputs) {
        expect(field.labelKey, `${id}.${field.name}`).toMatch(/^tools\./)
      }
    }
  })

  it('T1 tools declare no platform capabilities', () => {
    for (const id of TOOL_IDS) {
      const tool = TOOL_REGISTRY[id]
      if (tool.tier === 'T1') expect(tool.capabilities, id).toEqual([])
    }
  })

  it('T3 tools declare the network capability', () => {
    for (const id of TOOL_IDS) {
      const tool = TOOL_REGISTRY[id]
      if (tool.tier === 'T3') expect(tool.capabilities, id).toContain('network')
    }
  })
})
