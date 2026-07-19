import { describe, it, expect, beforeAll } from 'vitest'
import { products } from '../../data/products'
import type { CategoryInfo, ToolCategoryId } from '../../shared/types'

describe('products', () => {
  it('has 11 products', () => {
    expect(products.length).toBe(11)
  })

  it('each product has required fields', () => {
    for (const p of products) {
      expect(p.id).toBeTruthy()
      expect(typeof p.id).toBe('string')
      expect(p.icon).toBeTruthy()
      expect(p.url !== undefined).toBe(true)
      expect(['live', 'beta', 'wip', 'planned']).toContain(p.status)
    }
  })

  it('each product has unique id', () => {
    const ids = products.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each product has a valid URL when deployed', () => {
    for (const p of products) {
      if (p.url) {
        expect(p.url).toMatch(/^https?:\/\//)
      }
    }
  })

  it('each product has a non-empty icon emoji', () => {
    for (const p of products) {
      expect(p.icon.length).toBeGreaterThan(0)
      // Emoji characters are typically 2 chars in JS strings
      expect(p.icon.codePointAt(0)).toBeGreaterThanOrEqual(0x2000)
    }
  })

  it('has at least one live product', () => {
    expect(products.some(p => p.status === 'live')).toBe(true)
  })

  it('has at least one wip product', () => {
    expect(products.some(p => p.status === 'wip')).toBe(true)
  })
})

describe('tools', () => {
  let tools: any[]
  let categories: CategoryInfo[]

  beforeAll(async () => {
    const mod = await import('../../data/tools')
    tools = mod.tools
    categories = mod.toolCategories
  })

  it('dynamically loads all tools', () => {
    expect(tools.length).toBeGreaterThanOrEqual(1)
  })

  it('each tool has valid category', () => {
    const validCats: ToolCategoryId[] = ['dev', 'text', 'time', 'image', 'convert', 'security', 'math']
    for (const t of tools) {
      expect(validCats).toContain(t.category)
      expect(t.id).toBeTruthy()
      expect(typeof t.id).toBe('string')
      expect(t.component).toBeTruthy()
      expect(typeof t.component).toBe('string')
    }
  })

  it('each tool has required fields', () => {
    for (const t of tools) {
      expect(t.id).toBeTruthy()
      expect(t.category).toBeTruthy()
      expect(t.component).toBeTruthy()
      expect(t.icon).toBeTruthy()
      expect(t.icon.length).toBeGreaterThan(0)
    }
  })

  it('each tool has unique id', () => {
    const ids = tools.map((t: any) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each tool id matches its component slug pattern', () => {
    const slugToComponent: Record<string, string> = {
      'json-formatter': 'JsonFormatter',
      'regex-tester': 'RegexTester',
      'base64': 'Base64Codec',
      'url-encode': 'UrlEncoder',
      'jwt-decoder': 'JwtDecoder',
      'markdown-preview': 'MarkdownPreview',
      'word-counter': 'WordCounter',
      'text-diff': 'TextDiff',
      'timestamp': 'TimestampConverter',
      'date-calculator': 'DateCalculator',
      'qrcode': 'QrCodeGenerator',
      'color-picker': 'ColorPicker',
      'yaml-json': 'YamlJsonConverter',
      'html-entities': 'HtmlEntities',
      'uuid-generator': 'UuidGenerator',
      'html-preview': 'HtmlPreview',
      'case-converter': 'CaseConverter',
      'lorem-ipsum': 'LoremIpsum',
      'password-generator': 'PasswordGenerator',
      'image-to-base64': 'ImageToBase64',
      'number-base': 'NumberBaseConverter',
      'css-minifier': 'CssMinifier',
      'json-to-csv': 'JsonToCsv',
      'text-to-slug': 'TextToSlug',
      'list-sorter': 'ListSorter',
      'calculator': 'Calculator',
    }
    for (const t of tools) {
      expect(slugToComponent[t.id]).toBe(t.component)
    }
  })

  it('each tool has a valid npmDeps field when present', () => {
    for (const t of tools) {
      if (t.npmDeps) {
        expect(Array.isArray(t.npmDeps)).toBe(true)
        expect(t.npmDeps.length).toBeGreaterThan(0)
      }
    }
  })

  it('each tool component can be dynamically imported', async () => {
    const componentMap: Record<string, () => Promise<{ default: unknown }>> = {
      JsonFormatter: () => import('../../apps/web/src/components/tools/JsonFormatter'),
      Base64Codec: () => import('../../apps/web/src/components/tools/Base64Codec'),
      HtmlEntities: () => import('../../apps/web/src/components/tools/HtmlEntities'),
      UrlEncoder: () => import('../../apps/web/src/components/tools/UrlEncoder'),
      YamlJsonConverter: () => import('../../apps/web/src/components/tools/YamlJsonConverter'),
      JwtDecoder: () => import('../../apps/web/src/components/tools/JwtDecoder'),
      WordCounter: () => import('../../apps/web/src/components/tools/WordCounter'),
      ColorPicker: () => import('../../apps/web/src/components/tools/ColorPicker'),
      RegexTester: () => import('../../apps/web/src/components/tools/RegexTester'),
      TextDiff: () => import('../../apps/web/src/components/tools/TextDiff'),
      TimestampConverter: () => import('../../apps/web/src/components/tools/TimestampConverter'),
      DateCalculator: () => import('../../apps/web/src/components/tools/DateCalculator'),
      QrCodeGenerator: () => import('../../apps/web/src/components/tools/QrCodeGenerator'),
      MarkdownPreview: () => import('../../apps/web/src/components/tools/MarkdownPreview'),
      UuidGenerator: () => import('../../apps/web/src/components/tools/UuidGenerator'),
      HtmlPreview: () => import('../../apps/web/src/components/tools/HtmlPreview'),
      CaseConverter: () => import('../../apps/web/src/components/tools/CaseConverter'),
      LoremIpsum: () => import('../../apps/web/src/components/tools/LoremIpsum'),
      PasswordGenerator: () => import('../../apps/web/src/components/tools/PasswordGenerator'),
      ImageToBase64: () => import('../../apps/web/src/components/tools/ImageToBase64'),
      NumberBaseConverter: () => import('../../apps/web/src/components/tools/NumberBaseConverter'),
      CssMinifier: () => import('../../apps/web/src/components/tools/CssMinifier'),
      JsonToCsv: () => import('../../apps/web/src/components/tools/JsonToCsv'),
      TextToSlug: () => import('../../apps/web/src/components/tools/TextToSlug'),
      ListSorter: () => import('../../apps/web/src/components/tools/ListSorter'),
      Calculator: () => import('../../apps/web/src/components/tools/Calculator'),
    }
    for (const t of tools) {
      const loader = componentMap[t.component]
      expect(loader).toBeDefined()
      const mod = await loader()
      expect(mod.default).toBeDefined()
    }
  })
})

describe('tool categories', () => {
  let categories: CategoryInfo[]

  beforeAll(async () => {
    const mod = await import('../../data/tools')
    categories = mod.toolCategories
  })

  it('has 7 categories', () => {
    expect(categories.length).toBe(7)
  })

  it('each category has required fields', () => {
    for (const c of categories) {
      expect(c.id).toBeTruthy()
      expect(c.icon).toBeTruthy()
      expect(typeof c.order).toBe('number')
      expect(c.icon.length).toBeGreaterThan(0)
    }
  })

  it('every tool belongs to a valid category', async () => {
    const mod = await import('../../data/tools')
    const catIds = mod.toolCategories.map((c: CategoryInfo) => c.id)
    for (const t of mod.tools) {
      expect(catIds).toContain(t.category)
    }
  })

  it('categories have unique orders', () => {
    const orders = categories.map(c => c.order)
    expect(new Set(orders).size).toBe(orders.length)
  })

  it('categories are ordered sequentially from 1', () => {
    const orders = categories.map(c => c.order).sort((a, b) => a - b)
    expect(orders[0]).toBe(1)
    expect(orders[orders.length - 1]).toBe(orders.length)
  })
})